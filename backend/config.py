import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://thermolabel_user:thermolabel_password@localhost:5432/thermolabel_db"
)

# SQLAlchemy configuration
SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"
SQLALCHEMY_POOL_SIZE = int(os.getenv("SQLALCHEMY_POOL_SIZE", "20"))
SQLALCHEMY_POOL_RECYCLE = int(os.getenv("SQLALCHEMY_POOL_RECYCLE", "3600"))
SQLALCHEMY_POOL_PRE_PING = os.getenv("SQLALCHEMY_POOL_PRE_PING", "true").lower() == "true"

# Application settings
APP_NAME = "ThermoLabel API"
APP_VERSION = "0.3.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
