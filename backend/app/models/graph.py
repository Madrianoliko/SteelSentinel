from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from app.database import Base
import enum


class DependencyType(str, enum.Enum):
    POWER = "power"          # Zasilanie elektryczne
    WATER = "water"          # Zasilanie wodą
    TELECOM = "telecom"      # Łączność / internet
    TRANSPORT = "transport"  # Droga dojazdowa / logistyka
    STAFF = "staff"          # Kadra / pracownicy
    FUEL = "fuel"            # Paliwo


class InfrastructureEdge(Base):
    """
    Krawędź grafu zależności między obiektami infrastruktury.
    Semantyka: source_id ZALEŻY OD target_id w zakresie dependency_type
    Przykład: Szpital (source) zależy od Stacji Energetycznej (target) w zakresie POWER
    """
    __tablename__ = "infrastructure_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("infrastructure_nodes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("infrastructure_nodes.id"), nullable=False)
    dependency_type = Column(Enum(DependencyType), nullable=False)

    # Waga zależności: 1.0 = krytyczna, 0.5 = ważna, 0.1 = marginalna
    weight = Column(Float, default=1.0)

    # Czas do skutku po przerwaniu zależności (w godzinach)
    hours_to_impact = Column(Float, default=0.0)

    description = Column(String, nullable=True)
