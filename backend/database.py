from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager

from config import (
    DATABASE_URL,
    SQLALCHEMY_ECHO,
    SQLALCHEMY_POOL_SIZE,
    SQLALCHEMY_POOL_RECYCLE,
    SQLALCHEMY_POOL_PRE_PING,
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=SQLALCHEMY_ECHO,
    pool_size=SQLALCHEMY_POOL_SIZE,
    max_overflow=10,
    pool_recycle=SQLALCHEMY_POOL_RECYCLE,
    pool_pre_ping=SQLALCHEMY_POOL_PRE_PING,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for database operations outside FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables in database"""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all tables from database (use with caution!)"""
    Base.metadata.drop_all(bind=engine)


def init_db():
    """Initialize database"""
    create_tables()
    print("Database initialized successfully")
