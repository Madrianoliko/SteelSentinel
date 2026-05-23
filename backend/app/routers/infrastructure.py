from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.infrastructure import InfrastructureNode

router = APIRouter()


class NodeResponse:
    pass


from pydantic import BaseModel


class NodeResponse(BaseModel):
    id: int
    name: str
    category: str
    lat: float
    lng: float
    risk: str
    is_active: bool
    resources: dict
    hours_until_critical: Optional[float] = None
    description: Optional[str] = None
    sector: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NodeResponse])
def get_all_nodes(
    category: Optional[str] = None,
    risk: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Pobierz wszystkie węzły infrastruktury krytycznej."""
    query = db.query(InfrastructureNode).filter(InfrastructureNode.is_active == True)

    if category:
        query = query.filter(InfrastructureNode.category == category)
    if risk:
        query = query.filter(InfrastructureNode.risk == risk)

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
    from app.models.graph import InfrastructureEdge

    # BFS po grafie zależności
    visited = set()
    queue = [node_id]
    cascade = []

    while queue:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)

        edges = db.query(InfrastructureEdge).filter(
            InfrastructureEdge.source_id == current
        ).all()

        for edge in edges:
            if edge.target_id not in visited:
                target = db.query(InfrastructureNode).filter(
                    InfrastructureNode.id == edge.target_id
                ).first()
                if target:
                    cascade.append({
                        "node_id": target.id,
                        "name": target.name,
                        "category": target.category,
                        "hours_to_impact": edge.hours_to_impact,
                        "reason": edge.description or edge.dependency_type,
                        "risk": target.risk,
                    })
                queue.append(edge.target_id)

    cascade.sort(key=lambda x: (x["hours_to_impact"] or 0))
    return {"node_id": node_id, "cascade": cascade}
