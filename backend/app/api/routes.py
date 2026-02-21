# app/api/routes.py
"""API routes - Presentation Layer with Dependency Injection"""
from pathlib import Path
from typing import Any, List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Query, Body
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
import numpy as np

from app.core import get_db
from app.core.exceptions import ProjectNotFoundError, ValidationError
from app.models import ProjectExport
from app.schemas import ProjectCreate, SettingsUpdate
from app.services import ProjectService, SettingsService
from app.services.db_dump import export_dump_sql, import_dump_sql, import_dump_custom

router = APIRouter(prefix="/api", tags=["api"])


# Health endpoints
@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}


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


# Project exports (YOLO / COCO / Pascal VOC) — сохранение и скачивание из БД
VALID_EXPORT_FORMATS = {"yolo", "coco", "voc"}


@router.get("/projects/{project_id}/exports")
def list_project_exports(project_id: str, db: Session = Depends(get_db)):
    """Список сохранённых в БД экспортов проекта (формат и дата)."""
    try:
        ProjectService(db).get_project(project_id)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = db.query(ProjectExport).filter(ProjectExport.project_id == project_id).all()
    return [
        {"format": r.format, "created_at": r.created_at.isoformat() if r.created_at else None}
        for r in rows
    ]


@router.post("/projects/{project_id}/exports")
def save_project_export(
    project_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    """Save YOLO/COCO/VOC export for a project. Body: { \"format\": \"yolo\"|\"coco\"|\"voc\", \"content\": \"...\" }"""
    try:
        ProjectService(db).get_project(project_id)
    except ProjectNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    fmt = (payload.get("format") or "").strip().lower()
    if fmt not in VALID_EXPORT_FORMATS:
        raise HTTPException(status_code=400, detail="format must be one of: yolo, coco, voc")
    content = payload.get("content")
    if content is None:
        raise HTTPException(status_code=400, detail="content is required")
    if not isinstance(content, str):
        content = str(content)
    row = db.query(ProjectExport).filter(
        ProjectExport.project_id == project_id,
        ProjectExport.format == fmt,
    ).first()
    if row:
        row.content = content
    else:
        db.add(ProjectExport(project_id=project_id, format=fmt, content=content))
    db.commit()
    return {"ok": True, "format": fmt}


@router.get("/projects/{project_id}/exports/{format}")
def get_project_export(
    project_id: str,
    format: str,
    db: Session = Depends(get_db),
):
    """Download stored YOLO/COCO/VOC export for a project."""
    fmt = (format or "").strip().lower()
    if fmt not in VALID_EXPORT_FORMATS:
        raise HTTPException(status_code=400, detail="format must be one of: yolo, coco, voc")
    row = db.query(ProjectExport).filter(
        ProjectExport.project_id == project_id,
        ProjectExport.format == fmt,
    ).first()
    if not row or not row.content:
        raise HTTPException(status_code=404, detail="Export not found")
    media_types = {"yolo": "text/plain", "coco": "application/json", "voc": "application/xml"}
    ext = {"yolo": "txt", "coco": "json", "voc": "xml"}
    filename = f"export_{project_id}_{fmt}.{ext[fmt]}"
    return Response(
        content=row.content,
        media_type=media_types[fmt],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


# Database dump export/import
@router.get("/db/export")
async def db_export(data_only: bool = Query(False, description="Only data (for merging dumps)")):
    """Export database as SQL dump file. data_only=True — только данные, для слияния дампов."""
    try:
        content, filename = export_dump_sql(data_only=data_only)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return StreamingResponse(
        iter([content]),
        media_type="application/sql",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(content)),
        },
    )


@router.post("/db/import")
async def db_import(
    file: UploadFile = File(...),
    clear_before: str = Form("false"),
):
    """Import database from SQL or .dump. clear_before=true — очистить таблицы перед импортом (для полного дампа)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = (Path(file.filename).suffix or "").lower()
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")
    clear = clear_before.strip().lower() in ("true", "1", "on", "yes")
    try:
        if ext == ".dump":
            msg = import_dump_custom(content)
        else:
            msg = import_dump_sql(content, clear_before_import=clear)
        return {"ok": True, "message": msg}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
