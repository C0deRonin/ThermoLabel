# tests/conftest.py
"""Pytest configuration and fixtures.
   - In Docker (DATABASE_URL=postgres): no override; tests use real DB. Run:
     docker exec thermolabel-backend pytest tests/ -v --cov
   - Local (no DATABASE_URL): use SQLite in-memory and override get_db.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
# Use SQLite only when DATABASE_URL is not set (local run without Docker)
USE_SQLITE = "DATABASE_URL" not in os.environ
if USE_SQLITE:
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

import app.models  # noqa: F401 — register models with Base.metadata
from app.core import database
from app.core import get_db

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def client():
    """Test client. In Docker uses real DB; locally uses in-memory SQLite with override."""
    from app import create_app
    app = create_app()
    if USE_SQLITE:
        engine = create_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
        )
        database.Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        yield TestClient(app)
        database.Base.metadata.drop_all(bind=engine)
    else:
        yield TestClient(app)
