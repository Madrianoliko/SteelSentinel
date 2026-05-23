from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ThreatDetectionRequest(BaseModel):
    lat: float
    lng: float
    threat_type: str = "aerial_drone"
    flight_path: list = []


@router.post("/detect")
def detect_threat(payload: ThreatDetectionRequest, db: Session = Depends(get_db)):
    """
    Zarejestruj wykryte zagrożenie i uzyskaj rekomendację AI.
    """
    # TODO: logika ML / analiza ścieżki lotu → predykcja celu
    # Na razie: mock Explainable AI
    return {
        "threat_id": 1,
        "status": "detected",
        "predicted_target": {
            "node_id": 1,
            "name": "HSW S.A. — Huta Stalowa Wola",
            "confidence": 0.87
        },
        "ai_recommendation": {
            "action": "intercept",
            "asset_id": 3,
            "asset_name": "Dron C-UAS Alfa-3",
            "confidence": 0.91,
            "reason": (
                "Dron Alfa-3 znajduje się w promieniu 2.1km od przewidywanej trasy. "
                "Czas przechwycenia: ~40s. Zasięg bojowy: wystarczający. "
                "Alternatywa: Dron Beta-1 (czas: ~90s — za wolno)."
            )
        }
    }


@router.post("/{threat_id}/intercept")
def intercept_threat(threat_id: int, asset_id: int, db: Session = Depends(get_db)):
    """Wyślij środek przechwytujący do zagrożenia."""
    return {
        "threat_id": threat_id,
        "asset_id": asset_id,
        "status": "intercepted",
        "message": "Dron C-UAS Alfa-3 wysłany. Szacowany czas przechwycenia: 38 sekund."
    }


@router.post("/{threat_id}/evacuate")
def evacuate(threat_id: int, sector: Optional[str] = None, db: Session = Depends(get_db)):
    """Wyzwól ewakuację sektora."""
    return {
        "threat_id": threat_id,
        "sector": sector or "B",
        "status": "evacuation_ordered",
        "message": f"Ewakuacja sektora {sector or 'B'} zarządzona. Powiadomiono 3 412 mieszkańców.",
        "evacuation_routes": [
            {"route": "ul. Okulickiego → DK77 → kierunek Nisko", "capacity": "główna"},
            {"route": "ul. Hutnicza → DK9 → kierunek Tarnobrzeg", "capacity": "alternatywna"},
        ]
    }
