import subprocess
import sys
import time
import urllib.request
import shutil
import os

# Ensure stdout and stderr handle encodings cleanly on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def check_dependencies():
    print("[INFO] Checking system dependencies...")
    if not shutil.which("npm") and not shutil.which("npm.cmd"):
        print("[ERROR] 'npm' not found in PATH. Please install Node.js.")
        sys.exit(1)
    
    # Check Python dependencies
    try:
        import fastapi
        import uvicorn
        import pydantic
        import httpx
    except ImportError as e:
        print(f"[ERROR] Missing Python dependency: {e.name}. Run: pip install -r backend/requirements.txt")
        sys.exit(1)
    print("[OK] Python & Node.js dependencies verified.")

def wait_for_backend(url="http://127.0.0.1:8000/api/health", max_retries=20, delay=0.5):
    print(f"[WAIT] Waiting for backend readiness at {url} ...")
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=1.5) as res:
                if res.status == 200:
                    print(f"[OK] Backend ready after {attempt * delay:.1f}s.")
                    return True
        except Exception:
            pass
        time.sleep(delay)
    print("[WARN] Backend health check timed out. Proceeding with frontend launch...")
    return False

def start_aquavolt():
    print("[START] Starting AquaVolt Full-Stack Application (PS04)...")
    check_dependencies()
    
    # 1. Start FastAPI Backend on 127.0.0.1:8000
    print("[INFO] Launching Python FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd="backend"
    )

    # 2. Poll until backend is responding
    wait_for_backend()

    # 3. Start React Frontend on 127.0.0.1:3000
    print("[INFO] Launching React Vite Frontend on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" and shutil.which("npm.cmd") else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "3000"],
        cwd="frontend",
        shell=True
    )

    print("\n" + "="*60)
    print("[SUCCESS] AquaVolt PS04 Application is RUNNING!")
    print("  * Frontend Dashboard : http://localhost:3000 (or http://127.0.0.1:3000)")
    print("  * Backend API Root   : http://127.0.0.1:8000")
    print("  * Interactive Docs   : http://127.0.0.1:8000/docs")
    print("  * PS04 Digital Twin  : http://127.0.0.1:8000/api/digital-twin/state")
    print("="*60)
    print("Press Ctrl+C to stop all servers cleanly.\n")

    try:
        while True:
            # Check if any process died prematurely
            if backend_proc.poll() is not None:
                print("[ERROR] Backend server terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("[ERROR] Frontend dev server terminated unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping AquaVolt servers...")
    finally:
        try:
            if sys.platform == "win32":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(backend_proc.pid)], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(frontend_proc.pid)], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
            else:
                backend_proc.terminate()
                frontend_proc.terminate()
        except Exception:
            pass
        print("[OK] All AquaVolt servers stopped cleanly.")

if __name__ == "__main__":
    start_aquavolt()
