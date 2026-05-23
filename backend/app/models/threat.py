from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
from datetime import datetime


class ThreatEvent(Base):
    __tablename__ = "threat_events"

    id = Column(Integer, primary_key=True, index=True)
    threat_type = Column(String, nullable=False, default="aerial_drone")
    status = Column(String, nullable=False, default="detected")

    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    predicted_target_id = Column(Integer, nullable=True)
    predicted_target_confidence = Column(Float, default=0.0)

    flight_path = Column(JSONB, default=[])
    ai_recommendation = Column(JSONB, default={})

    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
