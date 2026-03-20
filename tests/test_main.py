"""Tests for core API endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Health endpoint returns 200 and ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root():
    """Root endpoint returns 200."""
    response = client.get("/")
    assert response.status_code == 200
