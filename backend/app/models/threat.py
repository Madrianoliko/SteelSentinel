from sqlalchemy import Column, Integer, String, Float, Enum, JSON, DateTime
from app.database import Base
from datetime import datetime
import enum


class ThreatType(str, enum.Enum):
    AERIAL_DRONE = "aerial_drone"          # Dron / BSP
    AERIAL_LOITERING = "aerial_loitering"  # Amunicja krążąca
    AERIAL_MISSILE = "aerial_missile"      # Rakieta
    SABOTAGE = "sabotage"                  # Sabotaż / dywersja
    CYBER = "cyber"                        # Atak cybernetyczny
    FLOOD = "flood"                        # Powódź
    LAND = "land"                          # Atak lądowy


class ThreatStatus(str, enum.Enum):
    DETECTED = "detected"
    TRACKED = "tracked"
    INTERCEPTED = "intercepted"
    IMPACT = "impact"
    RESOLVED = "resolved"


class ThreatEvent(Base):
    __tablename__ = "threat_events"

    id = Column(Integer, primary_key=True, index=True)
    threat_type = Column(Enum(ThreatType), nullable=False)
    status = Column(Enum(ThreatStatus), default=ThreatStatus.DETECTED)

    # Pozycja zagrożenia
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Przewidywany cel
    predicted_target_id = Column(Integer, nullable=True)  # FK do infrastructure_nodes
    predicted_target_confidence = Column(Float, default=0.0)  # 0.0 - 1.0

    # Ścieżka lotu (lista punktów)
    flight_path = Column(JSON, default=[])  # [{"lat": ..., "lng": ..., "t": sekunda}]

    # AI recommendation
    ai_recommendation = Column(JSON, default={})
    # {
    #   "action": "intercept",
    #   "asset_id": 3,
    #   "asset_name": "Dron C-UAS #3",
    #   "confidence": 0.87,
    #   "reason": "Dron #3 znajduje się w zasięgu i pokrywa przewidywaną trasę"
    # }

    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
