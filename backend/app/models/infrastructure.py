from sqlalchemy import Column, Integer, String, Float, Enum, JSON, Boolean
from app.database import Base
import enum


class InfrastructureCategory(str, enum.Enum):
    ENERGY = "energy"                  # Energetyczna
    WATER = "water"                    # Wodociągowa
    TELECOM = "telecom"                # Łączność / teleinformatyczna
    TRANSPORT = "transport"            # Transportowa
    HEALTH = "health"                  # Ochrona zdrowia
    ADMINISTRATION = "administration"  # Administracja publiczna
    INDUSTRIAL = "industrial"          # Przemysłowa / obronna
    CHEMICAL = "chemical"              # Chemiczna / paliwowa
    FOOD = "food"                      # Zaopatrzenie w żywność
    RESCUE = "rescue"                  # Ratownicza


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InfrastructureNode(Base):
    __tablename__ = "infrastructure_nodes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(Enum(InfrastructureCategory), nullable=False)
    lat = Column(Float, nullable=False)        # Szerokość geograficzna
    lng = Column(Float, nullable=False)        # Długość geograficzna
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    is_active = Column(Boolean, default=True)

    # Zasoby i stan
    resources = Column(JSON, default={})       # {"capacity": 100, "current": 85, "unit": "%"}
    consumption_per_day = Column(Float, nullable=True)
    hours_until_critical = Column(Float, nullable=True)  # Wyliczane dynamicznie

    # Metadane
    description = Column(String, nullable=True)
    address = Column(String, nullable=True)
    sector = Column(String, nullable=True)     # np. "A", "B", "C" — sektory miasta
    metadata = Column(JSON, default={})
