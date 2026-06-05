"""App-level smoke tests: the app boots, /health works, and /agents enforces auth.
No network: the missing-token path 401s before any InsForge/LLM call.
"""
import os
import sys

os.environ.setdefault("NEBIUS_API_KEY", "dummy")
os.environ.setdefault("INSFORGE_API_KEY", "dummy")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_agents_requires_auth():
    r = client.post("/agents", json={"name": "Test Bee", "interests": ["AI"]})
    assert r.status_code == 401
