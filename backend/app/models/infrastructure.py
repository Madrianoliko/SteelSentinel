from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
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
    CHEMICAL = "chemical"             # Chemiczna / paliwowa
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
    category = Column(String, nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    risk = Column(String, nullable=False, default="medium")   # low/medium/high/critical
    sector = Column(String, nullable=True)                    # A/B/C/D
    is_active = Column(Boolean, default=True)

    description = Column(Text, nullable=True)
    address = Column(String, nullable=True)

    resources = Column(JSONB, default={})
    hours_until_critical = Column(Float, nullable=True)

    # extra_data zamiast metadata (metadata jest zarezerwowane przez SQLAlchemy)
    extra_data = Column(JSONB, default={})
