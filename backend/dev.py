import os
import signal
import subprocess
import sys
from pathlib import Path


SERVICES = [
    ("gateway.app.main:app", 8000),
    ("services.auth.app.main:app", 8001),
    ("services.ai.app.main:app", 8002),
    ("services.voice.app.main:app", 8003),
    ("services.executor.app.main:app", 8004),
]


def main() -> int:
    backend_root = Path(__file__).resolve().parent
    env = os.environ.copy()
    env["PYTHONPATH"] = f"{backend_root}{os.pathsep}{env.get('PYTHONPATH', '')}"

    processes: list[subprocess.Popen] = []
    try:
        for module, port in SERVICES:
            process = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    module,
                    "--host",
                    "0.0.0.0",
                    "--port",
                    str(port),
                    "--reload",
                ],
                cwd=backend_root,
                env=env,
            )
            processes.append(process)
        return_code = 0
        for process in processes:
            return_code = process.wait()
            if return_code != 0:
                break
        return return_code
    except KeyboardInterrupt:
        return 0
    finally:
        for process in processes:
            if process.poll() is None:
                process.send_signal(signal.SIGTERM)
                process.wait(timeout=5)


if __name__ == "__main__":
    raise SystemExit(main())
