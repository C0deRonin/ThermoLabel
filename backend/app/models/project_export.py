# app/models/project_export.py
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from app.core.database import Base


class ProjectExport(Base):
    """Stored YOLO/COCO/Pascal VOC export per project."""

    __tablename__ = "project_exports"

    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    format = Column(String(20), primary_key=True)  # yolo, coco, voc
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
