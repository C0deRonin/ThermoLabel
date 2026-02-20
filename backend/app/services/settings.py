# app/services/settings.py
"""Settings service - Business Logic Layer"""
from typing import List
from sqlalchemy.orm import Session
from app.schemas import SettingsResponse, SettingsUpdate
from app.repositories import SettingsRepository


class SettingsService:
    """Settings service - Single Responsibility: settings business logic"""

    def __init__(self, db: Session):
        self.repository = SettingsRepository(db)

    def get_classes(self) -> SettingsResponse:
        """Get classes setting"""
        setting = self.repository.get_setting("classes")
        return SettingsResponse(classes=setting.value if setting else [])

    def save_classes(self, payload: SettingsUpdate) -> dict:
        """Save classes setting"""
        self.repository.set_setting("classes", payload.classes or [])
        return {"ok": True}
