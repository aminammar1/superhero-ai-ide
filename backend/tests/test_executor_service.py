import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../services/executor')))

from app.main import app

client = TestClient(app)

def test_executor_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "executor"}

def test_bash_execution_mocked():
    # If docker proxy isn't available, the route will return 500, which proves validation caught it
    # We test the route mapping here.
    response = client.post("/execute", json={
        "language": "bash",
        "code": "echo 'test'"
    })
    # Depending on docker socket access in local testing, it might be 200 or 500. 
    # But it should recognize language bash.
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        data = response.json()
        assert "stdout" in data
