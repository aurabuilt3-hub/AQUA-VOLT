import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import AnalyzeRequest
from app.services.orchestrator import analyze_operational_input
from app.services.telemetry import get_event_by_id
from app.services.pond_agent import analyze_pond_health
from app.services.energy_agent import analyze_energy_system
from app.services.cold_chain_agent import analyze_cold_chain
from app.services.risk_agent import analyze_risk_profile

client = TestClient(app)


def test_case_1_solar_drop_60_with_nominal_telemetry_not_critical():
    """
    TEST 1:
    If SOLAR_DROP_60 is triggered, but telemetry is altered to:
    - solar_kw: 18.4
    - battery_soc: 80
    - pond_do: 5.4
    - pond_do_trend: "stable"
    - cold_room_temp: 4.0
    - facility_load_kw: 12

    AquaVolt MUST NOT return the critical 83/100 score.
    It must recalculate risk from the altered telemetry.
    """
    payload = {
        "event_type": "SOLAR_DROP_60",
        "telemetry": {
            "solar_kw": 18.4,
            "battery_soc": 80.0,
            "pond_do": 5.4,
            "pond_do_trend": "stable",
            "cold_room_temp": 4.0,
            "facility_load_kw": 12.0
        }
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Risk must be dynamically recalculated and MUST NOT be 83 or CRITICAL
    assert data["risk"]["score"] < 40, f"Expected risk score < 40, got {data['risk']['score']}"
    assert data["risk"]["score"] != 83, "Score must not be hardcoded 83"
    assert data["risk"]["level"] in ("NORMAL", "LOW")
    assert data["safety"]["approval_required"] is False
    assert data["decision"]["status"] == "AUTO_SAFE"

    # Verify no reasons contain "Event severity: HIGH"
    for reason in data["risk"]["reasons"]:
        assert "Event severity: HIGH" not in reason
        assert "Event severity: high" not in reason


def test_case_2_custom_operational_input_dynamically_assessed():
    """
    TEST 2:
    If a generic or custom operational input is provided:
    'Solar output is 3.5 kW, battery is 25%, pond DO is 3.1 mg/L and falling, cold room is 4.8°C, facility load is 20 kW.'

    AquaVolt must:
    - normalize the input
    - infer/extract the telemetry state
    - feed it to the specialist agents
    - compute risk dynamically
    - return the unified operational plan
    """
    custom_text = (
        "Solar output is 3.5 kW, battery is 25%, pond DO is 3.1 mg/L and falling, "
        "cold room is 4.8°C, facility load is 20 kW."
    )
    payload = {
        "input": custom_text
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Inferred telemetry should reflect in agent findings
    assert data["agents"]["pond"]["status"] in ("warning", "critical")
    assert data["agents"]["energy"]["status"] in ("warning", "critical", "ok")
    assert data["agents"]["cold_chain"]["status"] in ("warning", "critical")

    # High stress condition should dynamically evaluate to high or critical risk
    assert data["risk"]["score"] >= 40, f"Expected elevated risk score for stressed telemetry, got {data['risk']['score']}"
    assert data["risk"]["level"] in ("HIGH", "CRITICAL")
    assert data["safety"]["approval_required"] is True
    assert data["decision"]["status"] == "PENDING"

    # Action plan must exist with protected and deferred loads
    assert len(data["plan"]["protect"]) > 0
    assert len(data["plan"]["defer"]) > 0

    # Ensure no static metadata leak
    for reason in data["risk"]["reasons"]:
        assert "Event severity:" not in reason


def test_case_3_normal_telemetry_under_high_risk_scenario_is_auto_safe():
    """
    TEST 3:
    If telemetry is normal under an event_type that was previously high risk:
    - risk level must be low/normal
    - human approval must NOT be required simply because of the scenario name or static template severity.
    """
    for high_risk_event in ["SOLAR_DROP_60", "GRID_FAILURE", "BATTERY_LOW_20", "POND_DO_FALLING", "COLD_ROOM_TEMP_RISING"]:
        req = AnalyzeRequest(
            event_type=high_risk_event,
            telemetry={
                "solar_kw": 18.4,
                "battery_soc": 90.0,
                "pond_do": 5.6,
                "pond_do_trend": "stable",
                "cold_room_temp": 3.8,
                "facility_load_kw": 10.0,
                "grid_available": True
            }
        )
        res = analyze_operational_input(req)
        assert res.risk.score < 25, f"{high_risk_event} with nominal telemetry scored {res.risk.score}, expected < 25"
        assert res.risk.level in ("NORMAL", "LOW")
        assert res.safety.approval_required is False, f"{high_risk_event} should not require approval with nominal telemetry"
        assert res.decision.status == "AUTO_SAFE"


def test_risk_reasons_contain_only_dynamic_factors():
    """Verify that reasons strictly cite dynamic telemetry factors rather than static tags."""
    req = AnalyzeRequest(
        event_type="SOLAR_DROP_60"
    )
    res = analyze_operational_input(req)
    assert any("Solar generation dropped" in r or "Pond" in r or "Battery" in r for r in res.risk.reasons)
    for r in res.risk.reasons:
        assert "Event severity: HIGH" not in r
