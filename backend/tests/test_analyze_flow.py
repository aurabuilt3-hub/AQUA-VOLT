from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_all_scenarios():
    inputs = [
        "Solar generation dropped 60%. Battery SOC is 38%. Pond DO is 4.2 mg/L.",
        "Grid failure detected. Solar is 9.2 kW. Battery SOC is 62%.",
        "Dissolved oxygen in Pond #2 dropped to 2.9 mg/L and falling.",
        "Battery SOC dropped to critical 18% reserve floor.",
        "Cold room temperature rose to 6.2C.",
        "Manual request to start 2 additional aerator motors.",
        "Optimal midday solar output at 18.4 kW.",
        "Energy demand exceeds capacity.",
        "Pond water temperature reached 30.5C.",
        "All systems nominal."
    ]

    for inp in inputs:
        res = client.post("/api/analyze", json={"input": inp})
        assert res.status_code == 200
        out = res.json()
        assert "analysis_id" in out
        assert "risk" in out
        assert "plan" in out
        assert "safety" in out
        print(f"[OK] Event: {out['event_id']} | Risk: {out['risk']['level']} ({out['risk']['score']}/100) | Approval: {out['safety']['approval_required']}")

if __name__ == "__main__":
    test_analyze_all_scenarios()
