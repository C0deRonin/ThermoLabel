# app/schemas/settings.py
from typing import List
from pydantic import BaseModel


class SettingsResponse(BaseModel):
    """Schema for settings response"""

    classes: List = []


class SettingsUpdate(BaseModel):
    """Schema for updating settings"""

    classes: List = []
