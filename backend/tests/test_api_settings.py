# tests/test_api_settings.py
"""Tests for settings API endpoints"""
import pytest


def test_get_classes_empty(client):
    """Test getting classes when empty"""
    response = client.get("/api/settings/classes")
    assert response.status_code == 200
    assert response.json() == {"classes": []}


def test_save_classes(client):
    """Test saving classes"""
    classes_data = {"classes": ["class1", "class2", "class3"]}
    response = client.put("/api/settings/classes", json=classes_data)
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_get_classes_after_save(client):
    """Test getting classes after saving"""
    # Save classes
    classes_data = {"classes": ["hot", "cold", "normal"]}
    client.put("/api/settings/classes", json=classes_data)

    # Get classes
    response = client.get("/api/settings/classes")
    assert response.status_code == 200
    result = response.json()
    assert result["classes"] == ["hot", "cold", "normal"]


def test_update_classes(client):
    """Test updating classes"""
    # Save initial classes
    classes_data = {"classes": ["class1", "class2"]}
    client.put("/api/settings/classes", json=classes_data)

    # Update classes
    new_classes = {"classes": ["new_class1", "new_class2", "new_class3"]}
    response = client.put("/api/settings/classes", json=new_classes)
    assert response.status_code == 200

    # Verify update
    response = client.get("/api/settings/classes")
    assert response.json()["classes"] == ["new_class1", "new_class2", "new_class3"]
