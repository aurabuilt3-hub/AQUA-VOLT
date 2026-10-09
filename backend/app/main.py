from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="AquaVolt Intelligence & Control Backend",
    description="Deterministic Energy Orchestration for Shrimp Hatcheries & Cold Storage (PS04)",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Enable CORS for local frontend development and Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "AquaVolt Intelligence & Control Backend",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_prefix": "/api"
    }

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
