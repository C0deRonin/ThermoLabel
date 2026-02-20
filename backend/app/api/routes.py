# app/api/routes.py
"""API routes - Presentation Layer with Dependency Injection"""
from pathlib import Path
from typing import Any, List
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
import numpy as np

from app.core import get_db
from app.core.exceptions import (
    ThermoLabelException,
    ProjectNotFoundError,
    ValidationError,
)
from app.schemas import ProjectCreate, SettingsUpdate
from app.services import ProjectService, SettingsService

router = APIRouter(prefix="/api", tags=["api"])


# Health endpoints
@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "version": "0.4.0"}


# Project endpoints
@router.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    """List all projects"""
    try:
        service = ProjectService(db)
        return service.get_all_projects()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Get project by id"""
    try:
        service = ProjectService(db)
        return service.get_project(project_id)
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects")
def upsert_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """Create or update project"""
    try:
        service = ProjectService(db)
        return service.create_or_update_project(payload)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """Delete project"""
    try:
        service = ProjectService(db)
        return service.delete_project(project_id)
    except ProjectNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Settings endpoints
@router.get("/settings/classes")
def get_classes_setting(db: Session = Depends(get_db)):
    """Get classes setting"""
    try:
        service = SettingsService(db)
        return service.get_classes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings/classes")
def save_classes_setting(payload: SettingsUpdate, db: Session = Depends(get_db)):
    """Save classes setting"""
    try:
        service = SettingsService(db)
        return service.save_classes(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# File processing endpoints
@router.post("/process-flir")
async def process_flir(file: UploadFile = File(...)):
    """Process FLIR thermal image"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in [".fff", ".seq", ".raw"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {file_ext}. Supported: .fff, .seq, .raw",
            )

        content = await file.read()
        if len(content) >= 4 and content[:4] == b"FLIR":
            return {"format": "FLIR radiometric", "size": len(content), "status": "detected"}

        return {
            "format": file_ext,
            "size": len(content),
            "status": "raw_data",
            "note": "Full FLIR processing requires additional libraries",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/find-duplicates")
async def find_duplicates(files: List[UploadFile] = File(...)):
    """Find duplicate images"""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    return {
        "total_files": len(files),
        "duplicates_found": [],
        "note": "Full duplicate detection requires image processing",
    }


@router.post("/detect-anomalies")
async def detect_anomalies(annotations: dict):
    """Detect temperature anomalies"""
    ann_list = annotations.get("annotations", [])
    if not ann_list:
        return {"anomalies": [], "total": 0}

    temps = [a.get("tempStats", {}).get("mean", 0) for a in ann_list]
    mean = np.mean(temps)
    std = np.std(temps)

    anomalies = []
    for i, temp in enumerate(temps):
        z_score = abs((temp - mean) / std) if std > 0 else 0
        if z_score > 2:
            anomalies.append(
                {
                    "index": i,
                    "temperature": float(temp),
                    "z_score": float(z_score),
                }
            )

    return {
        "anomalies": anomalies,
        "total": len(ann_list),
        "mean_temperature": float(mean),
        "std_deviation": float(std),
    }


@router.get("/supported-formats")
async def supported_formats():
    """Get supported file formats"""
    return {
        "image_formats": ["JPEG", "PNG", "BMP", "TIFF"],
        "thermal_formats": ["FLIR .fff", "FLIR .seq", "Seek Thermal .raw"],
        "export_formats": ["YOLO", "COCO JSON", "Pascal VOC"],
    }


@router.post("/validate-annotations")
async def validate_annotations(data: dict):
    """Validate annotations"""
    annotations = data.get("annotations", [])
    issues = []
    warnings = []
    for i, ann in enumerate(annotations):
        temp = ann.get("tempStats", {}).get("mean", 0)
        if temp < -20 or temp > 120:
            issues.append(
                f"Annotation {i}: Temperature out of normal range ({temp}°C)"
            )
    return {
        "valid": len(issues) == 0,
        "total_annotations": len(annotations),
        "issues": issues,
        "warnings": warnings,
    }
