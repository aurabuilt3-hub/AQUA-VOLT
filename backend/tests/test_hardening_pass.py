import pytest
from unittest import mock
from app.models.schemas import AnalyzeRequest, ApprovalRequest
from app.services.orchestrator import analyze_operational_input, generate_action_plan
from app.services.telemetry import get_event_by_id
from app.services.impact import calculate_plan_impact
from app.services.control_layer import execute_control_action
from app.services.ai_gateway import orchestrate_with_ai_gateway

class TestHardeningPass:

    def test_custom_operational_input_classification(self):
        """Unrecognized operational inputs must map to CUSTOM_OPERATIONAL_INPUT, not SOLAR_NORMAL"""
        req = AnalyzeRequest(
            input="Unusual water salinity variation observed in Sector 3 ponds with 14.0 kW solar and 65% battery."
        )
        res = analyze_operational_input(req)
        assert res.event_id == "CUSTOM_OPERATIONAL_INPUT"
        assert res.event_title == "Custom Operational Observation"
        # Overrides must be applied
        assert res.situation is not None

    def test_cost_avoided_exact_consistency(self):
        """Modeled PoC Cost Avoided must strictly equal energy_optimized_kwh * 9.50 (no arbitrary bonuses)"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        impact = calculate_plan_impact(plan)
        expected_cost = round(impact.energy_optimized_kwh * 9.50, 2)
        assert impact.cost_avoided_inr == expected_cost
        assert impact.cost_avoided_inr == 79.80

    def test_normal_operation_scenario(self):
        """Normal scenario: 18.4 kW solar, 80% SOC, 5.4 DO -> NORMAL / 0, Approval False, AUTO_SAFE"""
        req = AnalyzeRequest(
            input="Solar generation normal at 18.4 kW. Battery SOC is 80%. Pond DO is 5.4 mg/L and rising. Cold room is 4.0°C. Total load is 11.2 kW. Grid is online."
        )
        res = analyze_operational_input(req)
        assert res.risk.level == "NORMAL"
        assert res.risk.score == 0
        assert res.safety.approval_required is False
        assert res.decision.status == "AUTO_SAFE"

    def test_flagship_demo_scenario(self):
        """Flagship scenario: 60% drop, 38% SOC, 4.2 DO falling -> 83/100, CRITICAL, PENDING"""
        req = AnalyzeRequest(
            input="Solar generation dropped 60%. Battery SOC is 38%. Pond DO is 4.2 mg/L and falling. Cold room is 4.3°C. Facility load is 18.3 kW. Grid is available."
        )
        res = analyze_operational_input(req)
        assert res.risk.level == "CRITICAL"
        assert res.risk.score == 83
        assert res.safety.approval_required is True
        assert res.decision.status == "PENDING"
        assert len(res.safety.interventions) > 0

    def test_rejection_flow_dispatches_zero_twin_commands(self):
        """Rejecting an operational plan must produce REJECTED status and not command physical/twin equipment"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(
            event_id="SOLAR_DROP_60",
            action="reject",
            notes="Rejected by operator for scheduled maintenance."
        )
        result = execute_control_action(req, plan)
        assert result["status"] == "reject"
        sim = result["simulation"]
        # The only action in simulation should be plan_rejection_fallback with success=False
        assert len(sim.control_actions) == 1
        assert sim.control_actions[0].action == "plan_rejection_fallback"
        assert sim.control_actions[0].success is False
        # Rejection must produce 0.0 realized execution impact
        assert sim.impact.cost_avoided_inr == 0.0
        assert sim.impact.energy_optimized_kwh == 0.0
        assert sim.audit_entry.impact.cost_avoided_inr == 0.0
        assert sim.audit_entry.action_taken == "REJECTED"

    def test_modify_flow_locks_critical_loads(self):
        """Modify flow allows operator overrides on flexible loads while keeping critical loads locked"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(
            event_id="SOLAR_DROP_60",
            action="modify",
            notes="Operator Override: Ice Plant DEFERRED, Processing FORCE_ON"
        )
        result = execute_control_action(req, plan)
        assert result["status"] == "modify"
        sim = result["simulation"]
        # Aerator soft start and BMS floor reserve must still be commanded
        actions = [a.action for a in sim.control_actions]
        assert "aerator_soft_start" in actions
        assert "battery_reserve_lock" in actions

    def test_ai_gateway_fallback_when_no_api_key(self, monkeypatch):
        """AI Gateway must gracefully fall back to deterministic optimization when GEMINI_API_KEY is not set"""
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = AnalyzeRequest(event_type="SOLAR_DROP_60")
        res = analyze_operational_input(req)
        assert res.ai_used is False
        assert res.ai_fallback_reason == "GEMINI_API_KEY not configured"
        # Safety and plan remain complete and deterministic
        assert res.safety.policies_checked == 9
        assert len(res.plan.protect) > 0
