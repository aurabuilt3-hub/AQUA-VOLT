"""Test Suite for AgentShield Integration in AquaVolt:

Tests:
1. Normalized AquaVolt Shared State (Phase 7)
2. Specialist Agent Extended Fields (Phase 8)
3. Deterministic Decision Engine (Phase 10)
4. Policy Engine Evaluation (Phase 12)
5. Human in the Loop Approval Engine (Phase 13)
6. Controlled Tool Gateway: Registry, Parameter bounds, Policy blocking, Human approval gating, Twin dispatch (Phase 14)
7. PS04 Digital Twin: Soft-start inrush clamp, Thermal pre-cooling buffer, Load shedding (Phases 15, 16, 17)
8. Comprehensive Governance Audit Logging (Phase 18)
9. Main Demo Scenario: SOLAR_DROP_60 E2E Flow (Phase 20)
10. Error Handling & Edge Cases (Phase 22)
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.models.schemas import (
    ToolCallRequest, ApprovalRequest, IoTEvent
)
from app.services.telemetry import get_event_by_id, get_all_events
from app.services.context_engine import normalize_event_state
from app.services.pond_agent import analyze_pond_health
from app.services.energy_agent import analyze_energy_system
from app.services.cold_chain_agent import analyze_cold_chain
from app.services.risk_agent import analyze_risk_profile
from app.services.decision_engine import (
    evaluate_load_priorities, evaluate_soft_start_rig, evaluate_precooling_rig
)
from app.services.safety import evaluate_policy_engine, evaluate_safety_policies
from app.services.orchestrator import generate_action_plan, build_coordinated_action_plan
from app.services.tool_gateway import execute_tool_controlled, REGISTERED_TOOLS
from app.services.digital_twin import digital_twin
from app.governance.audit import audit_logger
from app.governance.approvals import approval_engine
from app.services.control_layer import run_execution_simulation


# ── 1. Normalized Shared State (Phase 7) ──────────────────────────────────────
class TestNormalizedSharedState:
    def test_normalize_solar_drop_event(self):
        ev = get_event_by_id("SOLAR_DROP_60")
        state = normalize_event_state(ev)
        assert state.solar_kw == 4.1
        assert state.battery_soc == 38.0
        assert state.pond_do == 4.2
        assert state.cold_room_temperature == 4.3
        assert state.grid_available is True
        assert state.aerator_status in ("soft_start_active", "running")

    def test_compact_state_structure(self):
        ev = get_event_by_id("BATTERY_LOW_20")
        state = normalize_event_state(ev)
        d = state.model_dump()
        expected_keys = [
            "timestamp", "solar_kw", "battery_soc", "grid_available",
            "pond_do", "pond_temperature", "cold_room_temperature",
            "cold_room_target", "aerator_status", "cooling_status",
            "ice_plant_status", "processing_status"
        ]
        for k in expected_keys:
            assert k in d, f"Missing normalized state key: {k}"


# ── 2. Specialist Agent Extended Fields (Phase 8) ─────────────────────────────
class TestSpecialistAgentOutputs:
    def test_pond_agent_extended_fields(self):
        out = analyze_pond_health(dissolved_oxygen=3.2, do_trend="falling", water_temperature=28.5)
        assert hasattr(out, "risk")
        assert hasattr(out, "observations")
        assert hasattr(out, "recommended_actions")
        assert hasattr(out, "confidence")
        assert hasattr(out, "reasoning_summary")
        assert out.risk == "warning"
        assert len(out.observations) > 0
        assert len(out.recommended_actions) > 0
        assert out.confidence >= 0.90

    def test_energy_agent_extended_fields(self):
        out = analyze_energy_system(solar_generation=4.0, battery_soc=25.0, grid_availability=False, load_demand=12.0)
        assert hasattr(out, "available_energy")
        assert hasattr(out, "energy_deficit")
        assert hasattr(out, "battery_risk")
        assert hasattr(out, "recommendations")
        assert out.available_energy > 0
        assert out.battery_risk == "warning"

    def test_cold_chain_agent_extended_fields(self):
        out = analyze_cold_chain(cold_room_temperature=4.8, target_temperature_min=2.0, target_temperature_max=5.0)
        assert hasattr(out, "cooling_risk")
        assert hasattr(out, "thermal_buffer")
        assert hasattr(out, "recommendations")
        assert out.cooling_risk == "warning"


# ── 3. Deterministic Decision Engine (Phase 10) ───────────────────────────────
class TestDecisionEngine:
    def test_load_priority_protects_aerators_and_cold_storage(self):
        ev = get_event_by_id("SOLAR_DROP_60")
        state = normalize_event_state(ev)
        keep, defer, strat = evaluate_load_priorities(state, pond_risk="warning", cold_risk="low")
        keep_titles = [item.title for item in keep]
        assert any("Aerator" in t for t in keep_titles), "Aerators must be kept running as P1 priority"
        assert any("Cold Storage" in t for t in keep_titles), "Cold storage must be kept running"

    def test_flexible_loads_deferred_under_solar_deficit(self):
        ev = get_event_by_id("SOLAR_DROP_60")
        state = normalize_event_state(ev)
        keep, defer, strat = evaluate_load_priorities(state)
        defer_titles = [item.title for item in defer]
        assert any("Ice Production" in t for t in defer_titles), "Ice plant must be deferred during solar deficit"
        assert any("Processing Line" in t for t in defer_titles), "Processing line must be deferred during solar deficit"

    def test_soft_start_rig_clamps_inrush(self):
        ev = get_event_by_id("AERATOR_START_REQUESTED")
        state = normalize_event_state(ev)
        rig = evaluate_soft_start_rig(state, inrush_risk=True)
        assert rig.enabled is True
        assert rig.peak_inrush_prevented_kw == 12.1
        assert rig.ramp_duration_sec == 120

    def test_precooling_rig_engages_on_solar_surplus(self):
        ev = get_event_by_id("SOLAR_NORMAL")
        state = normalize_event_state(ev)
        state.solar_kw = 16.5  # Solar surplus
        state.cold_room_temperature = 4.0
        rig = evaluate_precooling_rig(state)
        assert rig.enabled is True
        assert rig.cold_storage_precooled_temp_c == 1.5
        assert rig.thermal_energy_stored_kwh == 6.8


# ── 4. Policy Engine Evaluation (Phase 12) ────────────────────────────────────
class TestPolicyEngine:
    def test_policy_engine_response_format(self):
        ev = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(ev)
        fs = ev  # activate event
        res = evaluate_policy_engine(
            build_coordinated_action_plan(
                ev, ev,
                analyze_pond_health(4.2),
                analyze_energy_system(4.1, 38.0),
                analyze_cold_chain(4.3),
                analyze_risk_profile(analyze_pond_health(4.2), analyze_energy_system(4.1, 38.0), analyze_cold_chain(4.3), "high")
            ),
            ev,
            event=ev
        )
        assert hasattr(res, "allowed")
        assert hasattr(res, "requires_human_approval")
        assert hasattr(res, "violations")
        assert hasattr(res, "warnings")
        assert res.requires_human_approval is True


# ── 5. Human in the Loop Approval Engine (Phase 13) ───────────────────────────
class TestApprovalEngine:
    def test_approval_lifecycle(self):
        approval_engine.clear()
        req = approval_engine.create_request(
            event_id="TEST_EV",
            event_title="Test Event",
            proposed_plan={"keep": ["aeration"]},
            agent_outputs={},
            reasoning_summary="Protect aeration",
            safety_result={"passed": True},
            risk_level="HIGH",
            risk_score=75
        )
        assert req.status == "PENDING"

        # Approve
        updated = approval_engine.process_decision(
            event_id="TEST_EV",
            action="approve",
            reviewer="Demo Operator",
            notes="Reviewed and safe to proceed"
        )
        assert updated.status == "APPROVED"
        assert updated.executed_action == "APPROVED"
        assert updated.operator_notes == "Reviewed and safe to proceed"


# ── 6. Controlled Tool Gateway (Phase 14) ─────────────────────────────────────
class TestToolGateway:
    def test_tool_registry_contains_7_ps04_tools(self):
        expected_tools = [
            "startAeratorSoftStart",
            "stopAerator",
            "startPrecooling",
            "reduceCoolingLoad",
            "pauseIceProduction",
            "pauseProcessing",
            "maintainBatteryReserve"
        ]
        for t in expected_tools:
            assert t in REGISTERED_TOOLS, f"Tool '{t}' missing from REGISTERED_TOOLS"

    def test_unknown_tool_is_blocked(self):
        req = ToolCallRequest(tool_name="unauthorized_remote_shell", parameters={"cmd": "reboot"})
        res = execute_tool_controlled(req)
        assert res.status == "BLOCKED"
        assert "UNKNOWN TOOL" in res.message

    def test_parameter_bounds_enforced(self):
        # ramp_seconds min is 30
        req = ToolCallRequest(tool_name="startAeratorSoftStart", parameters={"ramp_seconds": 10})
        res = execute_tool_controlled(req)
        assert res.status == "ERROR"
        assert "violates minimum limit" in res.message

    def test_policy_1_blocks_stopping_aerators_at_critical_do(self):
        req = ToolCallRequest(
            tool_name="stopAerator",
            parameters={"aerator_ids": [1, 2]},
            human_approved=True
        )
        # DO = 2.8 mg/L (< 3.5 limit)
        res = execute_tool_controlled(req, current_pond_do=2.8)
        assert res.status == "BLOCKED"
        assert "POLICY 1 VIOLATION" in res.message

    def test_policy_2_blocks_reducing_cooling_when_temp_is_high(self):
        req = ToolCallRequest(tool_name="reduceCoolingLoad", human_approved=True)
        # Cold temp = 5.8°C (> 5.0 limit)
        res = execute_tool_controlled(req, current_cold_temp=5.8)
        assert res.status == "BLOCKED"
        assert "POLICY 2 VIOLATION" in res.message

    def test_policy_3_blocks_setting_battery_floor_below_20(self):
        req = ToolCallRequest(
            tool_name="maintainBatteryReserve",
            parameters={"floor_soc_pct": 10.0},
            human_approved=True
        )
        res = execute_tool_controlled(req)
        assert res.status == "BLOCKED"
        assert "POLICY 3 VIOLATION" in res.message

    def test_high_risk_tool_requires_human_approval(self):
        req = ToolCallRequest(
            tool_name="stopAerator",
            parameters={"aerator_ids": [1]},
            human_approved=False
        )
        # Even if DO is safe (4.5), stopping aerators is high risk and requires approval
        res = execute_tool_controlled(req, current_pond_do=4.5)
        assert res.status == "BLOCKED"
        assert "APPROVAL REQUIRED" in res.message

    def test_valid_tool_executes_on_digital_twin(self):
        req = ToolCallRequest(
            tool_name="startAeratorSoftStart",
            parameters={"ramp_seconds": 120, "stagger_seconds": 30},
            human_approved=True
        )
        res = execute_tool_controlled(req)
        assert res.status == "SUCCESS"
        assert "successfully executed" in res.message
        assert res.twin_state_after is not None


# ── 7. PS04 Digital Twin (Phases 15, 16, 17) ──────────────────────────────────
class TestDigitalTwinSimulation:
    def test_soft_start_clamps_inrush_on_twin(self):
        log = digital_twin.simulate_start_aerator_soft_start(ramp_seconds=120, stagger_seconds=30)
        assert digital_twin.aerators.mode == "VFD_SOFT_START"
        assert digital_twin.aerators.current_power_kw == 6.4
        assert digital_twin.aerators.inrush_suppressed_kw == 12.1
        assert "Inrush Clamped" in digital_twin.aerators.status_text

    def test_thermal_precooling_models_buffer_on_twin(self):
        log = digital_twin.simulate_start_precooling(target_temp_c=1.5)
        assert digital_twin.cold_storage.target_temp_c == 1.5
        assert digital_twin.cold_storage.thermal_energy_stored_kwh == 6.8
        assert digital_twin.cold_storage.compressor_safe_off_hours == 4.2
        assert digital_twin.cold_storage.precooled_active is True

    def test_load_shedding_on_twin(self):
        digital_twin.simulate_pause_ice_production(45)
        digital_twin.simulate_pause_processing(60)
        assert digital_twin.microgrid.ice_plant_kw == 0.0
        assert digital_twin.microgrid.processing_kw == 0.0


# ── 8. Comprehensive Governance Audit Logging (Phase 18) ──────────────────────
class TestGovernanceAuditLogger:
    def test_audit_logs_recorded(self):
        audit_logger.clear()
        audit_logger.log(
            component="Pond_Agent",
            event_type="ANALYSIS",
            event_id="SOLAR_DROP_60",
            title="Pond DO Evaluated",
            summary="DO at 4.2 mg/L, safe.",
            status="SUCCESS"
        )
        recent = audit_logger.get_recent(limit=10)
        assert len(recent) == 1
        assert recent[0].component == "Pond_Agent"
        assert recent[0].event_id == "SOLAR_DROP_60"


# ── 9. Main Demo Scenario: SOLAR_DROP_60 End-to-End (Phase 20) ───────────────
class TestMainDemoScenarioE2E:
    def test_solar_drop_60_complete_chain(self):
        """
        Verify the exact 8-step journey for 'Solar generation dropped 60%':
        1. IoT Event Ingested
        2. Specialist Agents Analysis (Pond, Energy, Cold, Risk)
        3. Orchestrator Unified Action Plan
        4. Safety Policy Engine Verification (9 Policies)
        5. Human Approval Gating (Mandatory)
        6. Tool Gateway Execution Dispatch
        7. PS04 Digital Twin Response
        8. Impact & Audit Trail
        """
        # Step 1: Ingest
        event = get_event_by_id("SOLAR_DROP_60")
        assert event is not None
        assert event.energy_state.solar_drop_percent == 60.0

        # Step 2: Agents
        pond = analyze_pond_health(event.pond_state.pond_do, event.pond_state.pond_do_trend)
        energy = analyze_energy_system(event.energy_state.solar_kw, event.battery_state.battery_soc)
        cold = analyze_cold_chain(event.cold_chain_state.cold_room_temp)
        risk = analyze_risk_profile(pond, energy, cold, event_severity=event.severity)
        assert risk.overall_risk in ("high", "critical")
        assert risk.human_approval_requirement is True

        # Step 3: Orchestrator Plan
        plan = generate_action_plan(event)
        assert plan.requires_human_approval is True
        assert len(plan.keep_running) > 0
        assert len(plan.defer_or_reduce) > 0

        # Step 4: Safety Check
        safety = evaluate_safety_policies(
            build_coordinated_action_plan(event, event, pond, energy, cold, risk),
            event,
            event=event
        )
        assert safety.requires_human_approval is True

        # Step 5: Human Approval
        req = ApprovalRequest(event_id=event.id, action="approve")

        # Step 6, 7 & 8: Simulation & Digital Twin & Impact & Audit
        sim_res = run_execution_simulation(req, plan)
        assert sim_res.action_taken == "approve"
        assert len(sim_res.control_actions) >= 4
        assert sim_res.impact.aerator_inrush_suppressed_kw > 0
        assert sim_res.audit_entry is not None


# ── 10. Error Handling & Edge Cases (Phase 22) ────────────────────────────────
class TestErrorHandling:
    def test_rejection_leaves_state_safe(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id=event.id, action="reject")
        sim_res = run_execution_simulation(req, plan)
        assert sim_res.action_taken == "reject"
        assert "reject" in sim_res.summary_message.lower()

    def test_invalid_parameters_handled_gracefully(self):
        req = ToolCallRequest(tool_name="startPrecooling", parameters={"target_temp_c": -15.0})
        res = execute_tool_controlled(req)
        assert res.status == "ERROR"
        assert "violates minimum limit" in res.message
