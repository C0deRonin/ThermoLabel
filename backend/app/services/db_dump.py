# app/services/db_dump.py
"""Service for database dump export/import via pg_dump and psql/pg_restore."""
import os
import re
import subprocess
import tempfile
from typing import Tuple
from urllib.parse import urlparse, unquote

# SET-параметры, которые есть только в PG17+ и ломают импорт в PG15
_UNSUPPORTED_SET_PATTERN = re.compile(
    r"^\s*SET\s+transaction_timeout\s*=",
    re.IGNORECASE,
)

from app.core.config import settings


def _parse_database_url(url: str) -> dict:
    """Parse DATABASE_URL into components for pg_dump/psql."""
    url = url.strip()
    if url.startswith("postgresql+"):
        url = "postgresql://" + url.split("://", 1)[-1]
    elif not url.startswith("postgresql://"):
        raise ValueError("DATABASE_URL must be postgresql://...")
    u = urlparse(url)
    path = (u.path or "/").lstrip("/").split("?")[0] or "postgres"
    netloc = u.netloc or ""
    if "@" not in netloc:
        raise ValueError("DATABASE_URL must contain user:password@host")
    auth, hostport = netloc.rsplit("@", 1)
    if ":" not in auth:
        raise ValueError("DATABASE_URL must contain user:password")
    user, password = auth.split(":", 1)
    user = unquote(user)
    password = unquote(password)
    if ":" in hostport:
        host, port = hostport.rsplit(":", 1)
    else:
        host = hostport
        port = "5432"
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": port,
        "dbname": path,
    }


def export_dump_sql(data_only: bool = False) -> Tuple[bytes, str]:
    """
    Export database as SQL using pg_dump.
    data_only: if True, only data (no schema) — для слияния дампов от нескольких человек.
    Returns (content, suggested_filename).
    """
    try:
        params = _parse_database_url(settings.DATABASE_URL)
    except ValueError as e:
        raise RuntimeError(f"Database URL configuration error: {e}") from e

    env = os.environ.copy()
    env["PGPASSWORD"] = params["password"]

    cmd = [
        "pg_dump",
        "-h", params["host"],
        "-p", params["port"],
        "-U", params["user"],
        "-d", params["dbname"],
        "--no-owner",
        "--no-acl",
    ]
    if data_only:
        cmd.append("--data-only")

    result = subprocess.run(
        cmd,
        env=env,
        capture_output=True,
        timeout=300,
    )

    if result.returncode != 0:
        err = (result.stderr or result.stdout or b"").decode("utf-8", errors="replace")
        raise RuntimeError(f"pg_dump failed: {err}")

    suffix = "_data_only" if data_only else ""
    filename = f"thermolabel_dump_{params['dbname']}{suffix}.sql"
    return result.stdout, filename


def _filter_sql_for_older_pg(content: bytes) -> bytes:
    """Remove SET commands for parameters not supported in PostgreSQL < 17 (e.g. transaction_timeout)."""
    text = content.decode("utf-8", errors="replace")
    lines = text.splitlines()
    filtered = [line for line in lines if not _UNSUPPORTED_SET_PATTERN.match(line)]
    return "\n".join(filtered).encode("utf-8")


def _run_psql_cmd(params: dict, env: dict, *args: str) -> None:
    """Run psql with given args; raise on non-zero exit."""
    cmd = [
        "psql",
        "-h", params["host"],
        "-p", params["port"],
        "-U", params["user"],
        "-d", params["dbname"],
        "-v", "ON_ERROR_STOP=1",
        *args,
    ]
    result = subprocess.run(cmd, env=env, capture_output=True, timeout=60)
    if result.returncode != 0:
        err = (result.stderr or result.stdout or b"").decode("utf-8", errors="replace")
        raise RuntimeError(f"psql failed: {err}")


def _drop_public_schema_objects(params: dict, env: dict) -> None:
    """Drop all tables and sequences in public schema (для полной замены по полному дампу)."""
    sql = """
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
      FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequencename) || ' CASCADE';
      END LOOP;
    END $$;
    """
    _run_psql_cmd(params, env, "-c", sql.strip())


def import_dump_sql(content: bytes, clear_before_import: bool = False) -> str:
    """Import database from SQL. clear_before_import=True — очистить схему перед импортом (для полного дампа)."""
    try:
        params = _parse_database_url(settings.DATABASE_URL)
    except ValueError as e:
        raise RuntimeError(f"Database URL configuration error: {e}") from e

    content = _filter_sql_for_older_pg(content)
    env = os.environ.copy()
    env["PGPASSWORD"] = params["password"]

    if clear_before_import:
        _drop_public_schema_objects(params, env)

    with tempfile.NamedTemporaryFile(suffix=".sql", delete=False) as f:
        try:
            f.write(content)
            f.flush()
            fname = f.name
        except Exception:
            os.unlink(f.name)
            raise

    try:
        cmd = [
            "psql",
            "-h", params["host"],
            "-p", params["port"],
            "-U", params["user"],
            "-d", params["dbname"],
            "-f", fname,
            "-v", "ON_ERROR_STOP=1",
        ]
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            timeout=600,
        )
        if result.returncode != 0:
            err = (result.stderr or result.stdout or b"").decode("utf-8", errors="replace")
            raise RuntimeError(f"psql import failed: {err}")
        return "Import completed successfully."
    finally:
        try:
            os.unlink(fname)
        except OSError:
            pass


def import_dump_custom(content: bytes) -> str:
    """Import database from custom-format dump (pg_restore). Returns success message or raises."""
    try:
        params = _parse_database_url(settings.DATABASE_URL)
    except ValueError as e:
        raise RuntimeError(f"Database URL configuration error: {e}") from e

    env = os.environ.copy()
    env["PGPASSWORD"] = params["password"]

    with tempfile.NamedTemporaryFile(suffix=".dump", delete=False) as f:
        try:
            f.write(content)
            f.flush()
            fname = f.name
        except Exception:
            os.unlink(f.name)
            raise

    try:
        cmd = [
            "pg_restore",
            "-h", params["host"],
            "-p", params["port"],
            "-U", params["user"],
            "-d", params["dbname"],
            "--clean",
            "--if-exists",
            "--no-owner",
            "--no-acl",
            fname,
        ]
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            timeout=600,
        )
        # pg_restore returns 1 for some warnings (e.g. "already exists") but still restores
        if result.returncode not in (0, 1):
            err = (result.stderr or result.stdout or b"").decode("utf-8", errors="replace")
            raise RuntimeError(f"pg_restore failed: {err}")
        return "Import completed successfully."
    finally:
        try:
            os.unlink(fname)
        except OSError:
            pass
