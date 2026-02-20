# app/services/db_dump.py
"""Service for database dump export/import via pg_dump and psql/pg_restore."""
import os
import subprocess
import tempfile
from typing import Tuple
from urllib.parse import urlparse, unquote

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


def export_dump_sql() -> Tuple[bytes, str]:
    """
    Export database as SQL using pg_dump.
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

    result = subprocess.run(
        cmd,
        env=env,
        capture_output=True,
        timeout=300,
    )

    if result.returncode != 0:
        err = (result.stderr or result.stdout or b"").decode("utf-8", errors="replace")
        raise RuntimeError(f"pg_dump failed: {err}")

    filename = f"thermolabel_dump_{params['dbname']}.sql"
    return result.stdout, filename


def import_dump_sql(content: bytes) -> str:
    """Import database from SQL content using psql. Returns success message or raises."""
    try:
        params = _parse_database_url(settings.DATABASE_URL)
    except ValueError as e:
        raise RuntimeError(f"Database URL configuration error: {e}") from e

    env = os.environ.copy()
    env["PGPASSWORD"] = params["password"]

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
