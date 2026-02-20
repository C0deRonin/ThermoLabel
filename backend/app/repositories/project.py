# app/repositories/project.py
"""Project repository - Single Responsibility Principle"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Project
from .base import Repository


class ProjectRepository(Repository[Project]):
    """Project data access layer - handles all project database operations"""

    def __init__(self, db: Session):
        super().__init__(db, Project)

    def get_all_ordered(self) -> List[Project]:
        """Get all projects ordered by updated_at descending"""
        return self.db.query(Project).order_by(Project.updated_at.desc()).all()

    def get_by_id(self, project_id: str) -> Optional[Project]:
        """Get project by id"""
        return self.db.query(Project).filter(Project.id == project_id).first()

    def create_or_update(self, project_id: str, **kwargs) -> Project:
        """Create new project or update existing one"""
        project = self.get_by_id(project_id)
        if not project:
            project = Project(id=project_id)
            self.db.add(project)

        for key, value in kwargs.items():
            if hasattr(project, key):
                setattr(project, key, value)

        self.db.commit()
        self.db.refresh(project)
        return project

    def delete_by_id(self, project_id: str) -> bool:
        """Delete project by id"""
        project = self.get_by_id(project_id)
        if project:
            self.db.delete(project)
            self.db.commit()
            return True
        return False
