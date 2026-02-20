# app/models/app_setting.py
from sqlalchemy import Column, String, JSON
from app.core.database import Base


class AppSetting(Base):
    """AppSetting model - Single Responsibility: store application settings"""

    __tablename__ = "app_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(JSON, default=list)

    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {"key": self.key, "value": self.value}
