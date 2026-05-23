from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.graph import InfrastructureEdge

router = APIRouter()


@router.get("/")
def get_graph(db: Session = Depends(get_db)):
    """
    Pobierz pełny graf zależności w formacie vis.js (nodes + edges).
    """
    edges = db.query(InfrastructureEdge).all()
    return {
        "edges": [
            {
                "id": e.id,
                "from": e.source_id,
                "to": e.target_id,
                "dependency_type": e.dependency_type,
                "weight": e.weight,
                "hours_to_impact": e.hours_to_impact,
                "label": e.dependency_type,
            }
            for e in edges
        ]
    }


@router.get("/bottlenecks")
def get_bottlenecks(db: Session = Depends(get_db)):
    """
    Wylicz wąskie gardła grafu (węzły o największej liczbie zależnych obiektów).
    Używa prostej analizy stopnia węzła (in-degree).
    """
    from sqlalchemy import func
    from app.models.graph import InfrastructureEdge

    results = (
        db.query(
            InfrastructureEdge.target_id,
            func.count(InfrastructureEdge.id).label("dependents_count"),
            func.sum(InfrastructureEdge.weight).label("total_weight")
        )
        .group_by(InfrastructureEdge.target_id)
        .order_by(func.sum(InfrastructureEdge.weight).desc())
        .limit(10)
        .all()
    )

    return [
        {
            "node_id": r.target_id,
            "dependents_count": r.dependents_count,
            "total_weight": float(r.total_weight or 0),
        }
        for r in results
    ]
