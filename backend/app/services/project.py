# app/services/project.py
"""Project service - Business Logic Layer with Dependency Inversion"""
import base64
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import ProjectNotFoundError, ValidationError
from app.models import Project
from app.schemas import ProjectCreate, ProjectResponse, ProjectListResponse
from app.repositories import ProjectRepository


class ProjectService:
    """Project service - Single Responsibility: project business logic"""

    def __init__(self, db: Session):
        self.repository = ProjectRepository(db)
        self.db = db

    def get_all_projects(self) -> List[ProjectListResponse]:
        """Get all projects"""
        projects = self.repository.get_all_ordered()
        return [
            ProjectListResponse(
                id=p.id,
                name=p.name,
                created_at=p.created_at.isoformat() if p.created_at else None,
                updated_at=p.updated_at.isoformat() if p.updated_at else None,
            )
            for p in projects
        ]

    def get_project(self, project_id: str) -> ProjectResponse:
        """Get project by id"""
        project = self.repository.get_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(project_id)

        image_b64 = (
            base64.b64encode(project.image_data).decode("utf-8")
            if project.image_data
            else ""
        )

        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            image_width=project.image_width,
            image_height=project.image_height,
            palette=project.palette,
            image_data=image_b64,
            image_encoding="base64-bin",
            annotations=project.annotations_data or [],
            classes=project.classes_data or [],
            created_at=project.created_at.isoformat() if project.created_at else None,
            updated_at=project.updated_at.isoformat() if project.updated_at else None,
        )

    def create_or_update_project(self, payload: ProjectCreate) -> dict:
        """Create or update project"""
        if not payload.id:
            raise ValidationError("Project id is required")

        # Decode image if provided
        image_bytes = b""
        if payload.image_data:
            if payload.image_encoding in ["base64-u8", "base64-bin"]:
                try:
                    image_bytes = base64.b64decode(payload.image_data.encode("utf-8"))
                except Exception as e:
                    raise ValidationError(f"Invalid image data: {str(e)}")

        # Create or update project
        project = self.repository.create_or_update(
            project_id=payload.id,
            name=payload.name or "Unnamed project",
            description=payload.description,
            image_width=int(payload.image_width or 0),
            image_height=int(payload.image_height or 0),
            palette=payload.palette,
            image_data=image_bytes,
            annotations_data=payload.annotations or [],
            classes_data=payload.classes or [],
        )

        return {"ok": True, "id": project.id}

    def delete_project(self, project_id: str) -> dict:
        """Delete project"""
        project = self.repository.get_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(project_id)

        self.repository.delete_by_id(project_id)
        return {"ok": True}
