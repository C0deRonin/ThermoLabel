"""
backend/main.py
FastAPI сервер для обработки тепловизионных данных
"""

from pathlib import Path
from typing import Any
import base64
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, create_tables
from models import Project, AppSetting

app = FastAPI(title="ThermoLabel API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.3.0"}


@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    return [{"id": p.id, "name": p.name, "created_at": p.created_at.isoformat() if p.created_at else None, "updated_at": p.updated_at.isoformat() if p.updated_at else None} for p in projects]


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    image_b64 = base64.b64encode(project.image_data).decode("utf-8") if project.image_data else ""
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "image_width": project.image_width,
        "image_height": project.image_height,
        "palette": project.palette,
        "image_data": image_b64,
        "image_encoding": "base64-bin",
        "annotations": project.annotations_data or [],
        "classes": project.classes_data or [],
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


@app.post("/api/projects")
def upsert_project(payload: dict[str, Any], db: Session = Depends(get_db)):
    pid = str(payload.get("id") or "")
    if not pid:
        raise HTTPException(status_code=400, detail="Project id is required")

    project = db.query(Project).filter(Project.id == pid).first()
    if not project:
        project = Project(id=pid)
        db.add(project)

    image_data = payload.get("image_data") or ""
    if payload.get("image_encoding") == "base64-u8" and isinstance(image_data, str):
        image_bytes = base64.b64decode(image_data.encode("utf-8")) if image_data else b""
    elif payload.get("image_encoding") == "base64-bin" and isinstance(image_data, str):
        image_bytes = base64.b64decode(image_data.encode("utf-8")) if image_data else b""
    else:
        image_bytes = b""

    project.name = payload.get("name") or "Unnamed project"
    project.description = payload.get("description")
    project.image_width = int(payload.get("image_width") or 0)
    project.image_height = int(payload.get("image_height") or 0)
    project.palette = payload.get("palette")
    project.image_data = image_bytes
    project.annotations_data = payload.get("annotations") or []
    project.classes_data = payload.get("classes") or []

    db.commit()
    db.refresh(project)
    return {"ok": True, "id": project.id}


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True}


@app.get("/api/settings/classes")
def get_classes_setting(db: Session = Depends(get_db)):
    setting = db.query(AppSetting).filter(AppSetting.key == "classes").first()
    return {"classes": setting.value if setting else []}


@app.put("/api/settings/classes")
def save_classes_setting(payload: dict[str, Any], db: Session = Depends(get_db)):
    classes = payload.get("classes") or []
    setting = db.query(AppSetting).filter(AppSetting.key == "classes").first()
    if not setting:
        setting = AppSetting(key="classes", value=classes)
        db.add(setting)
    else:
        setting.value = classes
    db.commit()
    return {"ok": True}


@app.post("/api/process-flir")
async def process_flir(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in [".fff", ".seq", ".raw"]:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {file_ext}. Supported: .fff, .seq, .raw")

        content = await file.read()
        if len(content) >= 4 and content[:4] == b"FLIR":
            return {"format": "FLIR radiometric", "size": len(content), "status": "detected"}

        return {
            "format": file_ext,
            "size": len(content),
            "status": "raw_data",
            "note": "Full FLIR processing requires additional libraries",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/find-duplicates")
async def find_duplicates(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    return {"total_files": len(files), "duplicates_found": [], "note": "Full duplicate detection requires image processing"}


@app.post("/api/detect-anomalies")
async def detect_anomalies(annotations: dict):
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
            anomalies.append({"index": i, "temperature": float(temp), "z_score": float(z_score)})

    return {"anomalies": anomalies, "total": len(ann_list), "mean_temperature": float(mean), "std_deviation": float(std)}


@app.get("/api/supported-formats")
async def supported_formats():
    return {
        "image_formats": ["JPEG", "PNG", "BMP", "TIFF"],
        "thermal_formats": ["FLIR .fff", "FLIR .seq", "Seek Thermal .raw"],
        "export_formats": ["YOLO", "COCO JSON", "Pascal VOC"],
    }


def calculate_iou(box1: dict, box2: dict) -> float:
    x1_min, y1_min = box1["x"], box1["y"]
    x1_max, y1_max = box1["x"] + box1["w"], box1["y"] + box1["h"]
    x2_min, y2_min = box2["x"], box2["y"]
    x2_max, y2_max = box2["x"] + box2["w"], box2["y"] + box2["h"]
    x_inter_min = max(x1_min, x2_min)
    y_inter_min = max(y1_min, y2_min)
    x_inter_max = min(x1_max, x2_max)
    y_inter_max = min(y1_max, y2_max)
    if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
        return 0.0
    inter_area = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - inter_area
    return inter_area / union_area if union_area > 0 else 0.0


@app.post("/api/validate-annotations")
async def validate_annotations(data: dict):
    annotations = data.get("annotations", [])
    issues = []
    warnings = []
    for i, ann in enumerate(annotations):
      temp = ann.get("tempStats", {}).get("mean", 0)
      if temp < -20 or temp > 120:
          issues.append(f"Annotation {i}: Temperature out of normal range ({temp}°C)")
    return {"valid": len(issues) == 0, "total_annotations": len(annotations), "issues": issues, "warnings": warnings}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
