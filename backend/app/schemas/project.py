# app/schemas/project.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """Schema for creating/updating a project"""

    id: str = Field(..., min_length=1)
    name: Optional[str] = "Unnamed project"
    description: Optional[str] = None
    image_width: int = 0
    image_height: int = 0
    palette: Optional[str] = None
    image_data: Optional[str] = ""
    image_encoding: Optional[str] = "base64-bin"
    annotations: Optional[List] = []
    classes: Optional[List] = []


class ProjectResponse(BaseModel):
    """Schema for project response"""

    id: str
    name: str
    description: Optional[str]
    image_width: int
    image_height: int
    palette: Optional[str]
    image_data: str = ""
    image_encoding: str = "base64-bin"
    annotations: List = []
    classes: List = []
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Schema for project list response"""

    id: str
    name: str
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True
