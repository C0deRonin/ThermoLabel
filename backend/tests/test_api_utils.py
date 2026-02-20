# tests/test_api_utils.py
"""Tests for utility API endpoints"""
import pytest


def test_supported_formats(client):
    """Test supported formats endpoint"""
    response = client.get("/api/supported-formats")
    assert response.status_code == 200
    result = response.json()
    assert "image_formats" in result
    assert "thermal_formats" in result
    assert "export_formats" in result


def test_detect_anomalies_empty(client):
    """Test anomaly detection with empty annotations"""
    data = {"annotations": []}
    response = client.post("/api/detect-anomalies", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["anomalies"] == []
    assert result["total"] == 0


def test_detect_anomalies(client):
    """Test anomaly detection"""
    data = {
        "annotations": [
            {"tempStats": {"mean": 20.0}},
            {"tempStats": {"mean": 22.0}},
            {"tempStats": {"mean": 80.0}},  # Anomaly
        ]
    }
    response = client.post("/api/detect-anomalies", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["total"] == 3
    assert "anomalies" in result and isinstance(result["anomalies"], list)


def test_validate_annotations_empty(client):
    """Test validation with empty annotations"""
    data = {"annotations": []}
    response = client.post("/api/validate-annotations", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["valid"] is True
    assert result["total_annotations"] == 0


def test_validate_annotations_valid(client):
    """Test validation with valid annotations"""
    data = {
        "annotations": [
            {"tempStats": {"mean": 25.0}},
            {"tempStats": {"mean": 30.0}},
        ]
    }
    response = client.post("/api/validate-annotations", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["valid"] is True
    assert result["total_annotations"] == 2


def test_validate_annotations_invalid(client):
    """Test validation with invalid annotations"""
    data = {
        "annotations": [
            {"tempStats": {"mean": -50.0}},  # Out of range
            {"tempStats": {"mean": 150.0}},  # Out of range
        ]
    }
    response = client.post("/api/validate-annotations", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["valid"] is False
    assert len(result["issues"]) == 2
