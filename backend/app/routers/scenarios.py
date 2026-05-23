from fastapi import APIRouter

router = APIRouter()

SCENARIOS = {
    "wariant_ii_aerial": {
        "id": "wariant_ii_aerial",
        "name": "Wariant II — Atak powietrzny",
        "description": "Drony / amunicja krążąca atakuje kluczowe obiekty infrastruktury krytycznej Stalowej Woli.",
        "steps": [
            {
                "step": 1,
                "event": "drone_detected",
                "description": "Wykryto drona przeciwnika zbliżającego się od strony wschodniej",
                "lat": 50.5900, "lng": 22.1200,
                "target_node_id": 1,
            },
            {
                "step": 2,
                "event": "ai_recommendation",
                "description": "AI rekomenduje przechwycenie dronem C-UAS Alfa-3",
            },
            {
                "step": 3,
                "event": "intercept_success",
                "description": "Dron przeciwnika zestrzelony. Zagrożenie zneutralizowane.",
            },
            {
                "step": 4,
                "event": "drone_detected_2",
                "description": "Wykryto drugi dron. Cel: przepompownia wody.",
                "lat": 50.5780, "lng": 22.0950,
                "target_node_id": 4,
            },
            {
                "step": 5,
                "event": "no_assets",
                "description": "Brak dostępnych środków przechwytujących w zasięgu.",
                "options": ["evacuate"],
            },
            {
                "step": 6,
                "event": "impact",
                "description": "Dron uderzył w przepompownię wody. Analiza kaskadowa...",
                "affected_nodes": [
                    {"node_id": 4, "name": "Przepompownia wody", "status": "destroyed"},
                    {"node_id": 2, "name": "Szpital Powiatowy", "hours_to_impact": 6.0, "reason": "Brak wody"},
                    {"node_id": 7, "name": "Straż Pożarna", "hours_to_impact": 2.0, "reason": "Brak ciśnienia w hydrantach"},
                ]
            }
        ]
    }
}


@router.get("/")
def list_scenarios():
    return list(SCENARIOS.values())


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str):
    scenario = SCENARIOS.get(scenario_id)
    if not scenario:
        return {"error": "Scenariusz nie istnieje"}
    return scenario
