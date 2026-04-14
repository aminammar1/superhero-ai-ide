import subprocess
import tempfile
import time
import os
import shutil
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from common.config import get_settings

settings = get_settings()
app = FastAPI(title="SuperHero Executor Service", version="0.1.0")

# Persistent workspace directory shared between file operations and terminal
WORKSPACE_ROOT = Path("/tmp/hero-workspace")
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)

# Shell commands need much longer timeout than code execution (npm install etc.)
SHELL_TIMEOUT_SECONDS = 120


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
    "bash": {
        "image": "node:20-alpine",
        "filename": "script.sh",
        "command": ["sh", "/workspace/script.sh"],
    },
    "html": {
        "image": "node:20-alpine",
        "filename": "index.html",
        "command": ["sh", "-c", "cat /workspace/index.html"],
    },
    "rust": {
        "image": "rust:1.78-alpine",
        "filename": "main.rs",
        "command": [
            "sh",
            "-lc",
            "rustc /workspace/main.rs -o /workspace/main && /workspace/main",
        ],
    },
    "ruby": {
        "image": "ruby:3.3-alpine",
        "filename": "main.rb",
        "command": ["ruby", "/workspace/main.rb"],
    },
    "php": {
        "image": "php:8.3-cli-alpine",
        "filename": "main.php",
        "command": ["php", "/workspace/main.php"],
    },
}

DIRECT_COMMANDS = {
    "bash": lambda path: ["sh", str(path)],
    "python": lambda path: ["python3", str(path)],
    "javascript": lambda path: ["node", str(path)],
    "typescript": lambda path: ["tsx", str(path)],
    "go": lambda path: ["go", "run", str(path)],
    "java": lambda path: [
        "sh", "-c",
        f"javac {path} && java -cp {path.parent} {path.stem}",
    ],
    "c": lambda path: [
        "sh", "-c",
        f"gcc {path} -o {path}.out && {path}.out",
    ],
    "cpp": lambda path: [
        "sh", "-c",
        f"g++ {path} -std=c++17 -O2 -o {path}.out && {path}.out",
    ],
    "html": lambda path: ["cat", str(path)],
    "rust": lambda path: [
        "sh", "-c",
        f"rustc {path} -o {path}.out && {path}.out",
    ],
    "ruby": lambda path: ["ruby", str(path)],
    "php": lambda path: ["php", str(path)],
}


def run_direct(request: ExecuteRequest) -> dict:
    runtime = RUNTIMES.get(request.language)
    if not runtime:
        return {
            "stdout": "",
            "stderr": f"Unsupported language: {request.language}",
            "exit_code": 1,
            "language": request.language,
            "duration_ms": 0,
        }

    builder = DIRECT_COMMANDS.get(request.language)
    if not builder:
        return {
            "stdout": "",
            "stderr": (
                f"Direct execution not available for {request.language}. "
                "Docker sandbox required."
            ),
            "exit_code": 1,
            "language": request.language,
            "duration_ms": 0,
        }

    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="hero-exec-") as workdir:
        source_path = Path(workdir) / runtime["filename"]
        source_path.write_text(request.code, encoding="utf-8")
        command = builder(source_path)

        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=settings.docker_timeout_seconds,
                check=False,
            )
        except FileNotFoundError:
            return {
                "stdout": "",
                "stderr": f"Runtime for {request.language} is not installed.",
                "exit_code": 127,
                "language": request.language,
                "duration_ms": 0,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"Execution timed out after {settings.docker_timeout_seconds}s.",
                "exit_code": 124,
                "language": request.language,
                "duration_ms": settings.docker_timeout_seconds * 1000,
            }

    duration_ms = int((time.perf_counter() - started) * 1000)
    return {
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "exit_code": completed.returncode,
        "language": request.language,
        "duration_ms": duration_ms,
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
    except FileNotFoundError:
        return run_direct(request)
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution timed out.",
            "exit_code": 124,
            "language": request.language,
            "duration_ms": settings.docker_timeout_seconds * 1000,
        }


# ═══════════════════════════════════════════════
#   WORKSPACE FILESYSTEM API
# ═══════════════════════════════════════════════

class WriteFileRequest(BaseModel):
    path: str
    content: str

class ShellRequest(BaseModel):
    command: str


@app.post("/workspace/write")
async def workspace_write(req: WriteFileRequest):
    """Write a file to the workspace directory."""
    target = (WORKSPACE_ROOT / req.path).resolve()
    # Security: ensure we stay inside WORKSPACE_ROOT
    if not str(target).startswith(str(WORKSPACE_ROOT)):
        return {"success": False, "error": "Path traversal blocked"}
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(req.content, encoding="utf-8")
    return {"success": True, "path": str(target.relative_to(WORKSPACE_ROOT))}


@app.get("/workspace/read")
async def workspace_read(path: str):
    """Read a file from the workspace."""
    target = (WORKSPACE_ROOT / path).resolve()
    if not str(target).startswith(str(WORKSPACE_ROOT)):
        return {"success": False, "error": "Path traversal blocked"}
    if not target.exists():
        return {"success": False, "error": f"File not found: {path}"}
    return {"success": True, "content": target.read_text(encoding="utf-8")}


@app.get("/workspace/list")
async def workspace_list(path: str = ""):
    """List files/dirs in the workspace."""
    target = (WORKSPACE_ROOT / path).resolve()
    if not str(target).startswith(str(WORKSPACE_ROOT)):
        return {"success": False, "error": "Path traversal blocked"}
    if not target.exists():
        return {"success": True, "entries": []}

    entries = []
    try:
        for item in sorted(target.iterdir()):
            rel = str(item.relative_to(WORKSPACE_ROOT))
            entries.append({
                "name": item.name,
                "path": rel,
                "type": "folder" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None,
            })
    except PermissionError:
        pass
    return {"success": True, "entries": entries}


@app.delete("/workspace/delete")
async def workspace_delete(path: str):
    """Delete a file or folder from the workspace."""
    target = (WORKSPACE_ROOT / path).resolve()
    if not str(target).startswith(str(WORKSPACE_ROOT)):
        return {"success": False, "error": "Path traversal blocked"}
    if not target.exists():
        return {"success": False, "error": f"Not found: {path}"}
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    return {"success": True}


@app.post("/workspace/shell")
async def workspace_shell(req: ShellRequest):
    """Run a shell command inside the workspace directory."""
    try:
        started = time.perf_counter()
        completed = subprocess.run(
            ["sh", "-c", req.command],
            capture_output=True,
            text=True,
            timeout=SHELL_TIMEOUT_SECONDS,
            cwd=str(WORKSPACE_ROOT),
            check=False,
        )
        duration_ms = int((time.perf_counter() - started) * 1000)
        return {
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "exit_code": completed.returncode,
            "duration_ms": duration_ms,
        }
    except FileNotFoundError:
        return {"stdout": "", "stderr": "Shell not available.", "exit_code": 127, "duration_ms": 0}
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Timed out after {SHELL_TIMEOUT_SECONDS}s.", "exit_code": 124, "duration_ms": SHELL_TIMEOUT_SECONDS * 1000}
