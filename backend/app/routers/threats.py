from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.threat import ThreatEvent
from app.models.infrastructure import InfrastructureNode
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class ThreatDetectionRequest(BaseModel):
    lat: float
    lng: float
    threat_type: str = "aerial_drone"
    flight_path: List = []


@router.post("/detect")
def detect_threat(payload: ThreatDetectionRequest, db: Session = Depends(get_db)):
    """Zarejestruj wykryte zagrożenie i uzyskaj rekomendację AI."""

    # Prosta heurystyka: znajdź najbliższy węzeł jako cel
    nodes = db.query(InfrastructureNode).filter(InfrastructureNode.is_active == True).all()
    closest = None
    min_dist = float('inf')
    for n in nodes:
        dist = ((n.lat - payload.lat) ** 2 + (n.lng - payload.lng) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest = n

    target_id = closest.id if closest else 1
    target_name = closest.name if closest else "Nieznany"
    confidence = max(0.70, min(0.95, 1.0 - min_dist * 10))

    ai_rec = {
        "action": "intercept",
        "asset_id": 3,
        "asset_name": "Dron C-UAS Alfa-3",
        "confidence": round(confidence, 2),
        "reason": (
            f"Dron Alfa-3 w promieniu 2.1km od przewidywanej trasy. "
            f"Czas przechwycenia: ~40s. Zasięg: wystarczający."
        )
    }

    threat = ThreatEvent(
        threat_type=payload.threat_type,
        status="detected",
        lat=payload.lat,
        lng=payload.lng,
        predicted_target_id=target_id,
        predicted_target_confidence=round(confidence, 2),
        flight_path=payload.flight_path,
        ai_recommendation=ai_rec,
        detected_at=datetime.utcnow(),
    )
    db.add(threat)
    db.commit()
    db.refresh(threat)

    return {
        "threat_id": threat.id,
        "status": "detected",
        "predicted_target": {
            "node_id": target_id,
            "name": target_name,
            "confidence": round(confidence, 2),
        },
        "ai_recommendation": ai_rec,
    }


@router.get("/")
def get_threats(db: Session = Depends(get_db)):
    """Pobierz wszystkie zagrożenia."""
    threats = db.query(ThreatEvent).order_by(ThreatEvent.detected_at.desc()).limit(50).all()
    return [
        {
            "id": t.id,
            "threat_type": t.threat_type,
            "status": t.status,
            "lat": t.lat,
            "lng": t.lng,
            "predicted_target_id": t.predicted_target_id,
            "predicted_target_confidence": t.predicted_target_confidence,
            "ai_recommendation": t.ai_recommendation,
            "detected_at": t.detected_at.isoformat() if t.detected_at else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
        }
        for t in threats
    ]


@router.post("/{threat_id}/intercept")
def intercept_threat(threat_id: int, asset_id: int = 3, db: Session = Depends(get_db)):
    """Wyślij środek przechwytujący."""
    threat = db.query(ThreatEvent).filter(ThreatEvent.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Zagrożenie nie istnieje")

    threat.status = "intercepted"
    threat.resolved_at = datetime.utcnow()
    db.commit()

    return {
        "threat_id": threat_id,
        "asset_id": asset_id,
        "status": "intercepted",
        "message": "Dron C-UAS Alfa-3 wysłany. Szacowany czas przechwycenia: 38 sekund.",
    }


@router.post("/{threat_id}/evacuate")
def evacuate(threat_id: int, sector: Optional[str] = "C", db: Session = Depends(get_db)):
    """Wyzwól ewakuację sektora."""
    threat = db.query(ThreatEvent).filter(ThreatEvent.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Zagrożenie nie istnieje")

    threat.status = "evacuation"
    db.commit()

    return {
        "threat_id": threat_id,
        "sector": sector,
        "status": "evacuation_ordered",
        "message": f"Ewakuacja sektora {sector} zarządzona. Powiadomiono 3 412 mieszkańców.",
        "evacuation_routes": [
            {"route": "ul. Okulickiego → DK77 → kierunek Nisko", "capacity": "główna"},
            {"route": "ul. Hutnicza → DK9 → kierunek Tarnobrzeg", "capacity": "alternatywna"},
        ],
    }


@router.post("/{threat_id}/impact")
def register_impact(threat_id: int, db: Session = Depends(get_db)):
    """Zarejestruj uderzenie."""
    threat = db.query(ThreatEvent).filter(ThreatEvent.id == threat_id).first()
    if not threat:
        raise HTTPException(status_code=404, detail="Zagrożenie nie istnieje")

    threat.status = "impact"
    threat.resolved_at = datetime.utcnow()
    db.commit()

    return {"threat_id": threat_id, "status": "impact"}
