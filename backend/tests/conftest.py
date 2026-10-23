import os
import sys
import uuid

# Use a throwaway SQLite database so tests don't need Postgres.
DB_PATH = os.path.join(os.path.dirname(__file__), "test_studysync.db")
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-hs256"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def make_user(client):
    """Register a fresh user and return (auth headers, token, user id)."""

    def _make():
        name = f"u{uuid.uuid4().hex[:8]}"
        r = client.post("/api/auth/register", json={
            "email": f"{name}@example.com", "username": name, "password": "s3cret-pass",
        })
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me = client.get("/api/auth/me", headers=headers).json()
        return headers, token, me["id"]

    return _make
