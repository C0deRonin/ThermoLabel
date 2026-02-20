# app/models/project.py
from datetime import datetime
from sqlalchemy import Column, String, Integer, LargeBinary, JSON, DateTime
from app.core.database import Base


class Project(Base):
    """Project model - Single Responsibility: represent a thermal image project"""

    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, default="Unnamed project")
    description = Column(String, nullable=True)
    image_width = Column(Integer, default=0)
    image_height = Column(Integer, default=0)
    palette = Column(String, nullable=True)
    image_data = Column(LargeBinary, nullable=True)
    annotations_data = Column(JSON, default=list)
    classes_data = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_width": self.image_width,
            "image_height": self.image_height,
            "palette": self.palette,
            "image_data": self.image_data,
            "annotations": self.annotations_data or [],
            "classes": self.classes_data or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
