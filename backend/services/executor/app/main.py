import subprocess
import tempfile
import time
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from common.config import get_settings

settings = get_settings()
app = FastAPI(title="SuperHero Executor Service", version="0.1.0")


class ExecuteRequest(BaseModel):
    language: str
    code: str


RUNTIMES = {
    "python": {
        "image": "python:3.12-alpine",
        "filename": "main.py",
        "command": ["python", "/workspace/main.py"],
    },
    "javascript": {
        "image": "node:20-alpine",
        "filename": "main.js",
        "command": ["node", "/workspace/main.js"],
    },
    "typescript": {
        "image": "node:20-alpine",
        "filename": "main.ts",
        "command": ["sh", "-lc", "npx -y tsx /workspace/main.ts"],
    },
    "go": {
        "image": "golang:1.22-alpine",
        "filename": "main.go",
        "command": ["go", "run", "/workspace/main.go"],
    },
    "java": {
        "image": "eclipse-temurin:21-jdk-alpine",
        "filename": "Main.java",
        "command": [
            "sh",
            "-lc",
            "javac /workspace/Main.java && java -cp /workspace Main",
        ],
    },
    "c": {
        "image": "gcc:14",
        "filename": "main.c",
        "command": [
            "sh",
            "-lc",
            "gcc /workspace/main.c -o /workspace/main && /workspace/main",
        ],
    },
    "cpp": {
        "image": "gcc:14",
        "filename": "main.cpp",
        "command": [
            "sh",
            "-lc",
            "g++ /workspace/main.cpp -std=c++17 -O2 -o /workspace/main && /workspace/main",
        ],
    },
}


def simulate_execution(request: ExecuteRequest) -> dict:
    preview = "\n".join(request.code.splitlines()[:8])
    return {
        "stdout": (
            f"[mock-sandbox] {request.language} runtime ready.\n"
            "Docker sandbox is disabled, so this is a simulated execution.\n\n"
            f"Preview:\n{preview}"
        ),
        "stderr": "",
        "exit_code": 0,
        "language": request.language,
        "duration_ms": 12,
    }


def run_in_docker(request: ExecuteRequest) -> dict:
    runtime = RUNTIMES[request.language]
    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="hero-sandbox-") as workdir:
        workspace = Path(workdir)
        source_path = workspace / runtime["filename"]
        source_path.write_text(request.code, encoding="utf-8")

        command = [
            "docker",
            "run",
            "--rm",
            "--network",
            "none",
            "--cpus",
            "1",
            "--memory",
            "256m",
            "-v",
            f"{workspace}:/workspace",
            runtime["image"],
            *runtime["command"],
        ]
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=settings.docker_timeout_seconds,
            check=False,
        )

    duration_ms = int((time.perf_counter() - started) * 1000)
    return {
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "exit_code": completed.returncode,
        "language": request.language,
        "duration_ms": duration_ms,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "executor"}


@app.post("/execute")
async def execute(request: ExecuteRequest):
    if request.language not in RUNTIMES:
        return {
            "stdout": "",
            "stderr": f"Unsupported language: {request.language}",
            "exit_code": 1,
            "language": request.language,
            "duration_ms": 0,
        }

    if not settings.enable_docker_sandbox:
        return simulate_execution(request)

    try:
        return run_in_docker(request)
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution timed out in the Docker sandbox.",
            "exit_code": 124,
            "language": request.language,
            "duration_ms": settings.docker_timeout_seconds * 1000,
        }
    except FileNotFoundError:
        return {
            "stdout": "",
            "stderr": "Docker CLI was not found. Disable the sandbox or install Docker.",
            "exit_code": 127,
            "language": request.language,
            "duration_ms": 0,
        }
