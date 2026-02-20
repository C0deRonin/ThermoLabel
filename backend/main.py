"""
backend/main.py
FastAPI сервер для обработки тепловизионных данных
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from pathlib import Path
import io

app = FastAPI(title="ThermoLabel API", version="0.2.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}


@app.post("/api/process-flir")
async def process_flir(file: UploadFile = File(...)):
    """
    Обработка FLIR файлов
    Поддерживает форматы: .fff, .seq, .raw
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in ['.fff', '.seq', '.raw']:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported format: {file_ext}. Supported: .fff, .seq, .raw"
            )

        content = await file.read()
        
        # Basic FLIR detection
        if len(content) >= 4:
            header = content[:4]
            # FLIR файлы обычно начинаются с определенной сигнатуры
            if header == b'FLIR':
                return {
                    "format": "FLIR radiometric",
                    "size": len(content),
                    "status": "detected"
                }
        
        # Fallback: возвращаем info о файле
        return {
            "format": file_ext,
            "size": len(content),
            "status": "raw_data",
            "note": "Full FLIR processing requires additional libraries (flir, exiftool, or raw2thermal)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/find-duplicates")
async def find_duplicates(files: list[UploadFile] = File(...)):
    """
    Находит потенциальные дубликаты в наборе изображений
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")

        # Упрощенная реализация для демонстрации
        duplicates = []
        
        return {
            "total_files": len(files),
            "duplicates_found": duplicates,
            "note": "Full duplicate detection requires image processing"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect-anomalies")
async def detect_anomalies(annotations: dict):
    """
    Обнаруживает статистические аномалии в аннотациях
    """
    try:
        ann_list = annotations.get("annotations", [])
        
        if not ann_list:
            return {"anomalies": [], "total": 0}

        temps = [a["tempStats"]["mean"] for a in ann_list]
        
        # Простой Z-score анализ
        mean = np.mean(temps)
        std = np.std(temps)
        
        anomalies = []
        for i, temp in enumerate(temps):
            z_score = abs((temp - mean) / std) if std > 0 else 0
            if z_score > 2:  # 2-sigma rule
                anomalies.append({
                    "index": i,
                    "temperature": float(temp),
                    "z_score": float(z_score),
                    "deviation": "high" if temp > mean else "low"
                })
        
        return {
            "anomalies": anomalies,
            "total": len(ann_list),
            "mean_temperature": float(mean),
            "std_deviation": float(std)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/supported-formats")
async def supported_formats():
    """
    Возвращает список поддерживаемых форматов
    """
    return {
        "image_formats": ["JPEG", "PNG", "BMP", "TIFF"],
        "thermal_formats": ["FLIR .fff", "FLIR .seq", "Seek Thermal .raw"],
        "export_formats": ["YOLO", "COCO JSON", "Pascal VOC"],
        "note": "Backend can be extended with additional processing libraries"
    }


@app.post("/api/validate-annotations")
async def validate_annotations(data: dict):
    """
    Валидирует аннотации и возвращает рекомендации
    """
    try:
        annotations = data.get("annotations", [])
        classes = data.get("classes", [])
        
        issues = []
        warnings = []
        
        if not annotations:
            warnings.append("No annotations to validate")
        
        # Check for overlapping annotations
        for i, ann1 in enumerate(annotations):
            for j, ann2 in enumerate(annotations[i+1:], start=i+1):
                if ann1["type"] == "bbox" and ann2["type"] == "bbox":
                    iou = calculate_iou(ann1, ann2)
                    if iou > 0.1:
                        warnings.append(
                            f"Annotations {i} and {j} overlap significantly (IoU={iou:.2f})"
                        )
        
        # Check temperature ranges
        for i, ann in enumerate(annotations):
            temp = ann["tempStats"]["mean"]
            if temp < -20 or temp > 120:
                issues.append(f"Annotation {i}: Temperature out of normal range ({temp}°C)")
        
        return {
            "valid": len(issues) == 0,
            "total_annotations": len(annotations),
            "issues": issues,
            "warnings": warnings
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_iou(box1: dict, box2: dict) -> float:
    """
    Вычисляет IoU (Intersection over Union) для двух bounding boxes
    """
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
