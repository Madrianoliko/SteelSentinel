import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import Base, engine
from app.routers import infrastructure, graph, threats, scenarios

app = FastAPI(
    title="Steel Sentinel API",
    description="System analizy i ochrony infrastruktury krytycznej — SpaceShield Hack 2026",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(infrastructure.router, prefix="/api/infrastructure", tags=["Infrastruktura"])
app.include_router(graph.router, prefix="/api/graph", tags=["Graf zależności"])
app.include_router(threats.router, prefix="/api/threats", tags=["Zagrożenia"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["Scenariusze"])


@app.on_event("startup")
async def on_startup():
    """Utwórz tabele jeśli nie istnieją (tylko gdy baza dostępna)."""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Połączono z bazą danych i zweryfikowano schemat")
    except Exception as e:
        print(f"⚠️  Baza danych niedostępna przy starcie: {e}")
        print("   Uruchom: docker compose up -d db")


@app.get("/health")
def health():
    return {"status": "ok"}


# Serwuj zbudowany frontend (Vite build output → /static)
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
INDEX_HTML = os.path.join(STATIC_DIR, "index.html")

if os.path.isdir(STATIC_DIR) and os.path.isfile(INDEX_HTML):
    if os.path.isdir(ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

    @app.get("/")
    def serve_spa():
        return FileResponse(INDEX_HTML)

    @app.get("/{full_path:path}")
    def serve_spa_fallback(full_path: str):
        """Serwuj statyczne pliki (PNG, SVG, …) jeśli istnieją, inaczej SPA fallback."""
        candidate = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(INDEX_HTML)
else:
    @app.get("/")
    def root():
        return {
            "system": "Steel Sentinel",
            "status": "operational",
            "docs": "/docs",
            "version": "0.1.0",
            "note": "Uruchom 'cd frontend && npm run build' aby zbudować UI",
        }
