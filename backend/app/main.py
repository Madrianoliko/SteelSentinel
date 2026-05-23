from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.routers import infrastructure, graph, threats, scenarios

# Utwórz tabele przy starcie
Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {
        "system": "Steel Sentinel",
        "status": "operational",
        "docs": "/docs",
        "version": "0.1.0"
    }


@app.get("/health")
def health():
    return {"status": "ok"}
