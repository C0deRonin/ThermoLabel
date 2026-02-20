from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey, Boolean, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from database import Base


class Project(Base):
    """Проект с тепловым изображением и аннотациями"""
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Image data
    image_data = Column(LargeBinary, nullable=True)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    palette = Column(String(50), default='iron')
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    annotations = relationship("Annotation", back_populates="project", cascade="all, delete-orphan")
    classes = relationship("AnnotationClass", back_populates="project", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'image_width': self.image_width,
            'image_height': self.image_height,
            'palette': self.palette,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class AnnotationClass(Base):
    """Класс аннотации (Перегрев, Норма и т.д.)"""
    __tablename__ = "annotation_classes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    color = Column(String(7), nullable=False)  # Hex color like #FF0000
    temp_min = Column(Float, nullable=True)
    temp_max = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="classes")
    annotations = relationship("Annotation", back_populates="annotation_class")

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'color': self.color,
            'temp_min': self.temp_min,
            'temp_max': self.temp_max,
        }


class Annotation(Base):
    """Аннотация (bounding box или polygon)"""
    __tablename__ = "annotations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("annotation_classes.id"), nullable=False)
    
    # Annotation type
    type = Column(String(20), nullable=False)  # 'bbox' or 'polygon'
    
    # Coordinates for bbox
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    width = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    
    # Points for polygon (stored as JSON)
    points = Column(JSON, nullable=True)
    
    # Temperature data
    avg_temperature = Column(Float, nullable=True)
    min_temperature = Column(Float, nullable=True)
    max_temperature = Column(Float, nullable=True)
    
    # Export metadata
    export_formats = Column(JSON, default=lambda: {"yolo": None, "coco": None, "voc": None})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="annotations")
    annotation_class = relationship("AnnotationClass", back_populates="annotations")

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'class_id': self.class_id,
            'type': self.type,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'points': self.points,
            'avg_temperature': self.avg_temperature,
            'min_temperature': self.min_temperature,
            'max_temperature': self.max_temperature,
        }


class Analytics(Base):
    """Аналитика проекта"""
    __tablename__ = "analytics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    total_annotations = Column(Integer, default=0)
    total_classes = Column(Integer, default=0)
    
    # Class distribution (stored as JSON)
    class_distribution = Column(JSON, nullable=True)
    
    # Temperature statistics
    avg_temperature = Column(Float, nullable=True)
    min_temperature = Column(Float, nullable=True)
    max_temperature = Column(Float, nullable=True)
    
    # Annotation type distribution
    bbox_count = Column(Integer, default=0)
    polygon_count = Column(Integer, default=0)
    threshold_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="analytics")

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'total_annotations': self.total_annotations,
            'total_classes': self.total_classes,
            'class_distribution': self.class_distribution,
            'avg_temperature': self.avg_temperature,
            'min_temperature': self.min_temperature,
            'max_temperature': self.max_temperature,
            'bbox_count': self.bbox_count,
            'polygon_count': self.polygon_count,
            'threshold_count': self.threshold_count,
        }


class ExportLog(Base):
    """Логи экспортов"""
    __tablename__ = "export_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    format = Column(String(20), nullable=False)  # 'yolo', 'coco', 'voc'
    file_size = Column(Integer, nullable=True)
    status = Column(String(20), default='completed')  # 'completed', 'failed'
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'format': self.format,
            'file_size': self.file_size,
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
