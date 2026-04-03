import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../services/ai')))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai"}

def test_code_generation_fallback():
    response = client.post("/code", json={
        "prompt": "write a print hello world",
        "language": "python",
        "heroTheme": "spiderman"
    })
    assert response.status_code == 200
    data = response.json()
    assert "language" in data
    assert "code" in data
    assert "explanation" in data

def test_chat_stream_fallback():
    response = client.post("/chat/stream", json={
        "prompt": "hi",
        "heroTheme": "spiderman",
        "history": []
    })
    assert response.status_code == 200
    content = b"".join(response.iter_bytes())
    assert len(content) > 0
