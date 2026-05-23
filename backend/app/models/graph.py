from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class InfrastructureEdge(Base):
    """
    Krawędź grafu zależności między obiektami infrastruktury.
    source_id → dostarcza zasób → target_id
    dependency_type: energy | water | telecom | transport | fuel
    """
    __tablename__ = "infrastructure_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("infrastructure_nodes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("infrastructure_nodes.id"), nullable=False)
    dependency_type = Column(String, nullable=False)

    # Waga zależności: 1.0 = krytyczna, 0.5 = ważna, 0.1 = marginalna
    weight = Column(Float, default=1.0)

    # Czas do skutku po przerwaniu zależności (w godzinach)
    hours_to_impact = Column(Float, default=0.0)

    description = Column(String, nullable=True)
