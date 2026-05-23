from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.infrastructure import InfrastructureNode, InfrastructureCategory, RiskLevel
from pydantic import BaseModel

router = APIRouter()


class NodeResponse(BaseModel):
    id: int
    name: str
    category: str
    lat: float
    lng: float
    risk_level: str
    is_active: bool
    resources: dict
    hours_until_critical: Optional[float]
    description: Optional[str]
    sector: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NodeResponse])
def get_all_nodes(
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Pobierz wszystkie węzły infrastruktury krytycznej."""
    query = db.query(InfrastructureNode).filter(InfrastructureNode.is_active == True)

    if category:
        query = query.filter(InfrastructureNode.category == category)
    if risk_level:
        query = query.filter(InfrastructureNode.risk_level == risk_level)

    return query.all()


@router.get("/{node_id}", response_model=NodeResponse)
def get_node(node_id: int, db: Session = Depends(get_db)):
    """Pobierz szczegóły pojedynczego węzła."""
    node = db.query(InfrastructureNode).filter(InfrastructureNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Węzeł nie istnieje")
    return node


@router.get("/{node_id}/cascade")
def get_cascade_impact(node_id: int, db: Session = Depends(get_db)):
    """
    Oblicz kaskadowy wpływ zniszczenia danego węzła.
    Zwraca listę obiektów dotkniętych zniszczeniem wraz z czasem do skutku.
    """
    # TODO: implementacja BFS/DFS po grafie zależności
    # Na razie zwracamy mock
    return {
        "node_id": node_id,
        "cascade": [
            {"node_id": 2, "name": "Szpital Powiatowy", "hours_to_impact": 4.0, "reason": "Brak zasilania"},
            {"node_id": 5, "name": "Przepompownia wody", "hours_to_impact": 2.0, "reason": "Brak zasilania"},
            {"node_id": 8, "name": "Centrum zarządzania kryzysowego", "hours_to_impact": 1.0, "reason": "Brak łączności"},
        ]
    }
