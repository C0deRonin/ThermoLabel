# app/repositories/settings.py
"""Settings repository - Single Responsibility Principle"""
from typing import Optional
from sqlalchemy.orm import Session
from app.models import AppSetting
from .base import Repository


class SettingsRepository(Repository[AppSetting]):
    """Settings data access layer"""

    def __init__(self, db: Session):
        super().__init__(db, AppSetting)

    def get_setting(self, key: str) -> Optional[AppSetting]:
        """Get setting by key"""
        return self.db.query(AppSetting).filter(AppSetting.key == key).first()

    def set_setting(self, key: str, value) -> AppSetting:
        """Set or update setting"""
        setting = self.get_setting(key)
        if not setting:
            setting = AppSetting(key=key, value=value)
            self.db.add(setting)
        else:
            setting.value = value
        self.db.commit()
        self.db.refresh(setting)
        return setting
