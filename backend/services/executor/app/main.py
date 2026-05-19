import subprocess
import tempfile
import time
import os
import shutil
import shlex
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from common.config import get_settings

settings = get_settings()
app = FastAPI(title="SuperHero Executor Service", version="0.1.0")

# Persistent workspace directory shared between file operations and terminal
WORKSPACE_ROOT = Path("/tmp/hero-workspace")
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)

SHELL_TIMEOUT_SECONDS = 300
NPM_TIMEOUT_SECONDS = 900

PACKAGE_MANAGER_CMDS = frozenset({"npm", "npx", "yarn", "pnpm", "pip", "pip3", "go", "cargo", "mvn", "gradle"})
LONG_RUNNING_ARGS = frozenset({
    "install", "i", "ci", "add", "create", "init", "build", "run", "dev",
    "start", "serve", "tidy", "get", "mod", "update", "fetch", "test",
})
PACKAGE_MANAGER_MARKERS = (
    "npm ",
    "npx ",
    "yarn ",
    "pnpm ",
    "pip ",
    "pip3 ",
    "go ",
    "cargo ",
    "mvn ",
    "gradle ",
)


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

    # Try Docker sandbox first if enabled
    if settings.enable_docker_sandbox:
        try:
            return run_in_docker(request)
        except FileNotFoundError:
            # Docker not installed — fall through to direct execution
            pass
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timed out.",
                "exit_code": 124,
                "language": request.language,
                "duration_ms": settings.docker_timeout_seconds * 1000,
            }
        except Exception:
            # Docker daemon not running or other Docker error — fall through
            pass

    # Try direct (local) execution as fallback
    try:
        result = run_direct(request)
        # If direct execution succeeded (runtime was found), return it
        if result["exit_code"] != 127:
            return result
    except Exception:
        pass

    # Final fallback: simulated execution
    return simulate_execution(request)


# ═══════════════════════════════════════════════
#   WORKSPACE FILESYSTEM API
# ═══════════════════════════════════════════════

class WriteFileRequest(BaseModel):
    path: str
    content: str

class ShellRequest(BaseModel):
    command: str


def _safe_workspace_path(path: str) -> Path | None:
    target = (WORKSPACE_ROOT / path).resolve()
    try:
        target.relative_to(WORKSPACE_ROOT)
    except ValueError:
        return None
    return target


@app.post("/workspace/write")
async def workspace_write(req: WriteFileRequest):
    """Write a file to the workspace directory."""
    target = _safe_workspace_path(req.path)
    if target is None:
        return {"success": False, "error": "Path traversal blocked"}
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(req.content, encoding="utf-8")
    return {"success": True, "path": str(target.relative_to(WORKSPACE_ROOT))}


@app.get("/workspace/read")
async def workspace_read(path: str):
    """Read a file from the workspace. Returns text content or base64-encoded binary."""
    target = _safe_workspace_path(path)
    if target is None:
        return {"success": False, "error": "Path traversal blocked"}
    if not target.exists():
        return {"success": False, "error": f"File not found: {path}"}

    ext = target.suffix.lower()
    file_size = target.stat().st_size

    if (ext in TEXT_EXTENSIONS or _is_text_filename(target.name)) and file_size < MAX_CONTENT_SIZE:
        content = target.read_text(encoding="utf-8", errors="replace")
        return {"success": True, "content": content, "fileType": "text"}

    if ext in IMAGE_EXTENSIONS and file_size < MAX_BINARY_SIZE:
        import base64
        data = target.read_bytes()
        return {
            "success": True,
            "content": base64.b64encode(data).decode("ascii"),
            "fileType": "image",
            "mimeType": _get_mime_type(ext),
        }

    if file_size < MAX_BINARY_SIZE:
        return {
            "success": True,
            "fileType": "binary",
            "mimeType": _get_mime_type(ext),
            "size": file_size,
        }

    return {"success": False, "error": f"File too large: {file_size} bytes"}


@app.get("/workspace/list")
async def workspace_list(path: str = ""):
    """List files/dirs in the workspace."""
    target = _safe_workspace_path(path)
    if target is None:
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


@app.get("/workspace/tree")
async def workspace_tree():
    """Return the current workspace tree, including small text file contents."""
    return {"success": True, "files": _collect_tree(WORKSPACE_ROOT, WORKSPACE_ROOT)}


@app.delete("/workspace/delete")
async def workspace_delete(path: str):
    """Delete a file or folder from the workspace."""
    target = _safe_workspace_path(path)
    if target is None:
        return {"success": False, "error": "Path traversal blocked"}
    if not target.exists():
        return {"success": False, "error": f"Not found: {path}"}
    if target.is_dir():
        shutil.rmtree(target)
        if target == WORKSPACE_ROOT:
            WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)
    else:
        target.unlink()
    return {"success": True}


DEV_SERVER_PATTERNS = frozenset({"dev", "start", "serve", "watch", "preview"})

_bg_processes: dict[int, subprocess.Popen] = {}


def _is_dev_server_cmd(cmd_parts: list[str]) -> bool:
    if not cmd_parts:
        return False
    base = cmd_parts[0].lower()
    args_lower = [a.lower() for a in cmd_parts[1:]]
    if base in ("npm", "npx", "yarn", "pnpm"):
        return any(a in DEV_SERVER_PATTERNS for a in args_lower)
    if base in ("python", "python3") and any("flask" in a or "uvicorn" in a or "manage.py" in a for a in args_lower):
        return True
    if base == "go" and "run" in args_lower:
        return True
    if base == "node" and len(cmd_parts) > 1:
        return True
    return False


def _looks_like_dev_server_command(command: str, cmd_parts: list[str]) -> bool:
    if _is_dev_server_cmd(cmd_parts):
        return True
    lower = f" {command.lower()} "
    return any(
        needle in lower
        for needle in (
            " npm run dev",
            " npm start",
            " yarn dev",
            " yarn start",
            " pnpm dev",
            " pnpm start",
            " next dev",
            " vite ",
            " uvicorn ",
            " flask run",
        )
    )


def _split_shell_command(command: str) -> list[str]:
    try:
        return shlex.split(command)
    except ValueError:
        return command.strip().split()


def _looks_like_package_command(command: str, cmd_parts: list[str]) -> bool:
    if cmd_parts and cmd_parts[0].lower() in PACKAGE_MANAGER_CMDS:
        return True
    lower = f" {command.lower().strip()} "
    return any(marker in lower for marker in PACKAGE_MANAGER_MARKERS)


def _has_long_running_package_arg(command: str, cmd_parts: list[str]) -> bool:
    args_lower = {part.lower() for part in cmd_parts[1:]}
    if args_lower.intersection(LONG_RUNNING_ARGS):
        return True
    lower = command.lower()
    return any(
        needle in lower
        for needle in (
            " npm i",
            " npm install",
            " npm ci",
            " npm create",
            " npx create",
            " yarn add",
            " yarn install",
            " pnpm add",
            " pnpm install",
            " pip install",
            " go mod",
            " go get",
            " go build",
            " go test",
            " cargo build",
            " cargo install",
            " cargo test",
            " cargo fetch",
            " rustup",
        )
    )


@app.post("/workspace/shell")
async def workspace_shell(req: ShellRequest):
    timeout = SHELL_TIMEOUT_SECONDS
    try:
        command = req.command.strip()
        if not command:
            return {"stdout": "", "stderr": "No command provided.", "exit_code": 2, "duration_ms": 0}

        cmd_parts = _split_shell_command(command)
        base_cmd = cmd_parts[0].lower() if cmd_parts else ""
        has_long_arg = _has_long_running_package_arg(command, cmd_parts)
        is_pkg_manager = _looks_like_package_command(command, cmd_parts)
        is_dev_server = _looks_like_dev_server_command(command, cmd_parts)

        env = os.environ.copy()
        env["HOME"] = str(WORKSPACE_ROOT)
        env["NODE_ENV"] = "development"
        env["CI"] = "1"
        env["BROWSER"] = "none"
        env["HOST"] = "0.0.0.0"
        env["NO_COLOR"] = "1"
        env["TERM"] = "dumb"
        env["NPM_CONFIG_YES"] = "true"
        env["NPM_CONFIG_FUND"] = "false"
        env["NPM_CONFIG_AUDIT"] = "false"
        env["npm_config_yes"] = "true"
        env["npm_config_fund"] = "false"
        env["npm_config_audit"] = "false"

        # Go environment
        go_path = WORKSPACE_ROOT / ".go"
        go_path.mkdir(parents=True, exist_ok=True)
        env["GOPATH"] = str(go_path)
        env["GOMODCACHE"] = str(go_path / "pkg" / "mod")
        env["GOFLAGS"] = "-modcacherw"

        # Cargo/Rust environment
        cargo_home = WORKSPACE_ROOT / ".cargo"
        cargo_home.mkdir(parents=True, exist_ok=True)
        env["CARGO_HOME"] = str(cargo_home)
        env["RUSTUP_HOME"] = str(WORKSPACE_ROOT / ".rustup")

        # Build comprehensive PATH with all tool binary locations
        npm_global = WORKSPACE_ROOT / ".npm-global" / "bin"
        npm_global.mkdir(parents=True, exist_ok=True)
        extra_paths = [
            str(npm_global),
            str(go_path / "bin"),
            str(cargo_home / "bin"),
            "/usr/local/go/bin",
            "/usr/local/bin",
            "/usr/bin",
            "/bin",
        ]
        # Preserve existing system PATH but prepend our directories
        system_path = env.get("PATH", "/usr/local/bin:/usr/bin:/bin")
        env["PATH"] = ":".join(extra_paths) + ":" + system_path

        wrap = command
        if is_pkg_manager and base_cmd in ("npm", "npx", "yarn", "pnpm", "go", "cargo"):
            wrap = f"export HOME={WORKSPACE_ROOT} && {command}"

        if is_dev_server:
            proc = subprocess.Popen(
                ["sh", "-lc", wrap],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=str(WORKSPACE_ROOT),
                env=env,
            )
            _bg_processes[proc.pid] = proc

            import select
            output_lines = []
            # Give dev servers more time to produce startup output
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    break
                if proc.stdout and proc.stdout.fileno():
                    ready, _, _ = select.select([proc.stdout], [], [], min(remaining, 0.5))
                    if ready:
                        line = proc.stdout.readline()
                        if line:
                            output_lines.append(line)
                            # If we see a URL, server is ready — capture a bit more then stop
                            ll = line.lower()
                            if "http://" in ll or "https://" in ll or "localhost" in ll or "ready in" in ll:
                                # Read a few more lines for context
                                extra_deadline = time.monotonic() + 2
                                while time.monotonic() < extra_deadline:
                                    r2, _, _ = select.select([proc.stdout], [], [], 0.3)
                                    if r2:
                                        extra = proc.stdout.readline()
                                        if extra:
                                            output_lines.append(extra)
                                        else:
                                            break
                                    else:
                                        break
                                break
                        else:
                            break
                    else:
                        # No output available, if we already have lines keep waiting a bit
                        if output_lines and (time.monotonic() - deadline + 15) > 5:
                            break
                else:
                    time.sleep(0.3)

            ret = proc.poll()
            captured = "".join(output_lines)

            if ret is not None and ret != 0:
                rest = proc.stdout.read() if proc.stdout else ""
                return {
                    "stdout": captured + rest,
                    "stderr": "",
                    "exit_code": ret,
                    "duration_ms": 0,
                }

            url_hint = ""
            for line in output_lines:
                ll = line.lower()
                if "http://" in ll or "https://" in ll or "localhost" in ll:
                    url_hint = line.strip()
                    break

            status_line = f"── SERVER ONLINE (PID {proc.pid})"
            if url_hint:
                status_line += f" • {url_hint}"
            status_line += " ──"

            return {
                "stdout": f"{captured}\n{status_line}\n",
                "stderr": "",
                "exit_code": 0,
                "duration_ms": 0,
            }

        timeout = NPM_TIMEOUT_SECONDS if (is_pkg_manager and has_long_arg) else SHELL_TIMEOUT_SECONDS

        started = time.perf_counter()
        completed = subprocess.run(
            ["sh", "-lc", wrap],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(WORKSPACE_ROOT),
            env=env,
            check=False,
        )
        duration_ms = int((time.perf_counter() - started) * 1000)
        return {
            "stdout": completed.stdout[-8000:] if len(completed.stdout) > 8000 else completed.stdout,
            "stderr": completed.stderr[-4000:] if len(completed.stderr) > 4000 else completed.stderr,
            "exit_code": completed.returncode,
            "duration_ms": duration_ms,
        }
    except FileNotFoundError:
        return {"stdout": "", "stderr": "Shell not available.", "exit_code": 127, "duration_ms": 0}
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Timed out after {timeout}s. Try breaking the command into smaller steps.", "exit_code": 124, "duration_ms": timeout * 1000}


# ═══════════════════════════════════════════════
#   GITHUB PROJECT IMPORT
# ═══════════════════════════════════════════════

class GitHubImportRequest(BaseModel):
    repo_url: str  # e.g. "https://github.com/user/repo" or "user/repo"
    branch: str = "main"


def _parse_github_url(url: str) -> tuple[str, str] | None:
    """Extract owner/repo from GitHub URL or shorthand."""
    url = url.strip().rstrip("/")
    # Handle full URLs
    if "github.com/" in url:
        parts = url.split("github.com/")[-1].split("/")
        if len(parts) >= 2:
            owner = parts[0]
            repo = parts[1].replace(".git", "")
            return (owner, repo)
    # Handle shorthand "user/repo"
    elif "/" in url and not url.startswith("http"):
        parts = url.split("/")
        if len(parts) == 2:
            return (parts[0], parts[1].replace(".git", ""))
    return None


TEXT_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".java", ".c", ".cpp", ".h",
    ".hpp", ".rs", ".rb", ".php", ".swift", ".sh", ".bash", ".html", ".htm",
    ".css", ".scss", ".less", ".json", ".jsonc", ".xml", ".yaml", ".yml", ".toml",
    ".md", ".mdx", ".txt", ".env", ".gitignore", ".dockerignore", ".editorconfig",
    ".prettierrc", ".eslintrc", ".babelrc", ".lock", ".cfg", ".ini", ".conf",
    ".sql", ".graphql", ".vue", ".svelte", ".astro", ".prisma",
    ".mjs", ".cjs", ".mts", ".cts", ".zsh", ".fish",
    ".lua", ".r", ".rmd", ".scala", ".kt", ".kts", ".dart",
    ".cs", ".fs", ".fsx", ".hs", ".clj", ".ex", ".exs", ".erl", ".hrl",
    ".proto", ".thrift", ".avsc", ".graphqls", ".gql",
    ".dockerfile", ".makefile", ".cmake", ".gradle", ".pom",
    ".log", ".csv", ".tsv", ".diff", ".patch",
    ".svg", ".ico", ".cur",
    ".sum", ".mod",
}

BINARY_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".avif",
    ".pdf",
    ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a",
    ".mp4", ".webm", ".avi", ".mov", ".mkv",
    ".wasm",
    ".exe", ".dll", ".so", ".dylib", ".o", ".a",
    ".class", ".jar", ".war",
    ".pyc", ".pyo", ".pyd",
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".avif", ".svg", ".ico"}
MAX_CONTENT_SIZE = 256 * 1024  # 256 KB
MAX_BINARY_SIZE = 2 * 1024 * 1024  # 2 MB for base64-encoded binary files

# Files that should be treated as text but don't have a recognized extension
EXTENSIONLESS_TEXT_NAMES = frozenset({
    "dockerfile", "makefile", "cmakelists", "gemfile", "rakefile",
    "procfile", "vagrantfile", "justfile", "brewfile",
    ".gitignore", ".gitattributes", ".gitmodules", ".dockerignore",
    ".editorconfig", ".prettierrc", ".eslintrc", ".babelrc",
    ".npmrc", ".nvmrc", ".prettierignore", ".eslintignore",
    ".browserslistrc", ".yarnrc", ".tool-versions",
    ".ruby-version", ".node-version", ".python-version",
})

def _is_text_filename(name: str) -> bool:
    """Check if a file should be treated as text based on its full name."""
    lower = name.lower()
    if lower in EXTENSIONLESS_TEXT_NAMES:
        return True
    # .env and .env.* files
    if lower == ".env" or lower.startswith(".env."):
        return True
    return False


def _collect_tree(root: Path, base: Path) -> list[dict]:
    """Recursively collect file tree for API response, including text file content and binary file data."""
    entries = []
    try:
        def sort_key(path: Path):
            return (1 if path.is_file() else 0, path.name.lower())

        for item in sorted(root.iterdir(), key=sort_key):
            if item.is_dir() and (item.name.startswith(".") or item.name in ("node_modules", "__pycache__", "dist", "build", "target", "vendor")):
                continue
            rel = str(item.relative_to(base))
            if item.is_dir():
                entries.append({
                    "name": item.name,
                    "path": rel,
                    "type": "folder",
                    "children": _collect_tree(item, base),
                })
            else:
                entry: dict = {
                    "name": item.name,
                    "path": rel,
                    "type": "file",
                    "size": item.stat().st_size,
                }
                ext = item.suffix.lower()

                if (ext in TEXT_EXTENSIONS or _is_text_filename(item.name)) and item.stat().st_size < MAX_CONTENT_SIZE:
                    try:
                        entry["content"] = item.read_text(encoding="utf-8", errors="replace")
                        entry["fileType"] = "text"
                    except Exception:
                        pass
                elif ext in IMAGE_EXTENSIONS and item.stat().st_size < MAX_BINARY_SIZE:
                    try:
                        import base64
                        data = item.read_bytes()
                        entry["content"] = base64.b64encode(data).decode("ascii")
                        entry["fileType"] = "image"
                        entry["mimeType"] = _get_mime_type(ext)
                    except Exception:
                        pass
                elif ext in BINARY_EXTENSIONS and item.stat().st_size < MAX_BINARY_SIZE:
                    entry["fileType"] = "binary"
                    entry["mimeType"] = _get_mime_type(ext)
                else:
                    # For unknown files without recognized extension, try reading as text
                    if not ext and item.stat().st_size < MAX_CONTENT_SIZE:
                        try:
                            entry["content"] = item.read_text(encoding="utf-8", errors="replace")
                            entry["fileType"] = "text"
                        except Exception:
                            entry["fileType"] = "unknown"
                    else:
                        entry["fileType"] = "unknown"

                entries.append(entry)
    except PermissionError:
        pass
    return entries


def _get_mime_type(ext: str) -> str:
    mime_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
        ".tiff": "image/tiff", ".tif": "image/tiff", ".avif": "image/avif",
        ".svg": "image/svg+xml", ".ico": "image/x-icon",
        ".pdf": "application/pdf",
        ".zip": "application/zip", ".tar": "application/x-tar",
        ".gz": "application/gzip",
        ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
        ".mp4": "video/mp4", ".webm": "video/webm",
        ".woff": "font/woff", ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".wasm": "application/wasm",
    }
    return mime_map.get(ext, "application/octet-stream")


@app.post("/workspace/import-github")
async def workspace_import_github(req: GitHubImportRequest):
    """Import a GitHub repository into the workspace via ZIP download."""
    parsed = _parse_github_url(req.repo_url)
    if not parsed:
        return {"success": False, "error": "Invalid GitHub URL. Use 'user/repo' or full URL."}

    owner, repo = parsed
    zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{req.branch}.zip"

    try:
        import urllib.request
        import zipfile
        import io

        # Download the ZIP archive
        imported_branch = req.branch
        try:
            response = urllib.request.urlopen(zip_url, timeout=30)
            zip_data = response.read()
        except Exception as e:
            # Try 'master' branch as fallback
            if req.branch == "main":
                zip_url_master = f"https://github.com/{owner}/{repo}/archive/refs/heads/master.zip"
                try:
                    response = urllib.request.urlopen(zip_url_master, timeout=30)
                    zip_data = response.read()
                    imported_branch = "master"
                except Exception:
                    return {"success": False, "error": f"Could not download repo: {e}"}
            else:
                return {"success": False, "error": f"Could not download repo: {e}"}

        # Clear workspace and extract
        for item in WORKSPACE_ROOT.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()

        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            # GitHub ZIPs have a root folder like "repo-main/"
            # We want to extract contents without that wrapper
            root_prefix = ""
            for name in zf.namelist():
                if "/" in name:
                    root_prefix = name.split("/")[0] + "/"
                    break

            for info in zf.infolist():
                if info.is_dir():
                    continue
                # Strip the root prefix
                rel_path = info.filename
                if root_prefix and rel_path.startswith(root_prefix):
                    rel_path = rel_path[len(root_prefix):]
                if not rel_path:
                    continue

                target = (WORKSPACE_ROOT / rel_path).resolve()
                try:
                    target.relative_to(WORKSPACE_ROOT)
                except ValueError:
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(info) as src:
                    target.write_bytes(src.read())

        # Collect the file tree to return
        tree = _collect_tree(WORKSPACE_ROOT, WORKSPACE_ROOT)

        return {
            "success": True,
            "repo": f"{owner}/{repo}",
            "branch": imported_branch,
            "files": tree,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
