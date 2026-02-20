# tests/test_api_projects.py
"""Tests for project API endpoints"""
import pytest
from app.schemas import ProjectCreate


def test_health_check(client):
    """Test health endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.4.0"}


def test_list_projects_empty(client):
    """Test list projects when empty"""
    response = client.get("/api/projects")
    assert response.status_code == 200
    assert response.json() == []


def test_create_project(client):
    """Test creating a project"""
    project_data = {
        "id": "test-project-1",
        "name": "Test Project",
        "description": "A test project",
        "image_width": 800,
        "image_height": 600,
        "annotations": [],
        "classes": [],
    }
    response = client.post("/api/projects", json=project_data)
    assert response.status_code == 200
    result = response.json()
    assert result["ok"] is True
    assert result["id"] == "test-project-1"


def test_create_project_without_id(client):
    """Test creating project without id fails"""
    project_data = {
        "name": "Test Project",
    }
    response = client.post("/api/projects", json=project_data)
    assert response.status_code == 422


def test_get_project(client):
    """Test getting a project"""
    # Create project first
    project_data = {
        "id": "test-project-2",
        "name": "Test Project 2",
        "description": "Description",
    }
    client.post("/api/projects", json=project_data)

    # Get project
    response = client.get("/api/projects/test-project-2")
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == "test-project-2"
    assert result["name"] == "Test Project 2"
    assert result["description"] == "Description"


def test_get_project_not_found(client):
    """Test getting non-existent project"""
    response = client.get("/api/projects/nonexistent")
    assert response.status_code == 404


def test_list_projects(client):
    """Test listing multiple projects"""
    # Create multiple projects
    for i in range(3):
        project_data = {
            "id": f"test-project-{i}",
            "name": f"Project {i}",
        }
        client.post("/api/projects", json=project_data)

    response = client.get("/api/projects")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) == 3
    assert projects[0]["name"] == "Project 2"  # Ordered by updated_at desc


def test_update_project(client):
    """Test updating a project"""
    # Create project
    project_data = {
        "id": "test-project-3",
        "name": "Original Name",
    }
    client.post("/api/projects", json=project_data)

    # Update project
    update_data = {
        "id": "test-project-3",
        "name": "Updated Name",
        "description": "New description",
    }
    response = client.post("/api/projects", json=update_data)
    assert response.status_code == 200

    # Verify update
    response = client.get("/api/projects/test-project-3")
    assert response.json()["name"] == "Updated Name"
    assert response.json()["description"] == "New description"


def test_delete_project(client):
    """Test deleting a project"""
    # Create project
    project_data = {
        "id": "test-project-4",
        "name": "Test Project",
    }
    client.post("/api/projects", json=project_data)

    # Delete project
    response = client.delete("/api/projects/test-project-4")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    # Verify deletion
    response = client.get("/api/projects/test-project-4")
    assert response.status_code == 404


def test_delete_project_not_found(client):
    """Test deleting non-existent project"""
    response = client.delete("/api/projects/nonexistent")
    assert response.status_code == 404
