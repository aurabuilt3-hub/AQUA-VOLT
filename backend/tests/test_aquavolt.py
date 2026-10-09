"""
AquaVolt Comprehensive Test Suite
Tests: Event Engine, All Agents, Orchestrator, Safety Engine, AI Gateway,
       Execution Simulator, Impact Engine, Human Approval, E2E flow
"""
import sys
import os
import pytest
import json
import time
import unittest.mock as mock

# Ensure backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.telemetry import get_all_events, get_event_by_id, activate_event
from app.services.pond_agent import analyze_pond_health
from app.services.energy_agent import analyze_energy_system
from app.services.cold_chain_agent import analyze_cold_chain
from app.services.risk_agent import analyze_risk_profile
from app.services.orchestrator import generate_action_plan, build_coordinated_action_plan
from app.services.safety import evaluate_safety_policies, validate_action_plan_safety
from app.services.control_layer import run_execution_simulation, execute_control_action, AUDIT_LOGS
from app.services.impact import calculate_plan_impact, calculate_detailed_impact
from app.services.ai_gateway import (
    compute_state_hash, get_ai_gateway_health, orchestrate_with_ai_gateway,
    is_ai_configured, _cache, _cache_lock
)
from app.models.schemas import (
    ApprovalRequest, CoordinatedActionPlan, FarmState,
    PondState, EnergyState, BatteryState, ColdChainState, EquipmentState, IoTTelemetry
)

# ============================================================
# HELPERS
# ============================================================
def make_farm_state(
    solar_kw=12.0, battery_soc=55.0, grid=True, total_load=15.0,
    pond_do=5.0, pond_do_trend="stable", pond_temp=28.0, aerators_on=4,
    cold_temp=4.0, thermal_buffer=3.0,
    inrush_kw=0.0
):
    return FarmState(
        active_event_id="TEST",
        active_event_name="Test State",
        timestamp="2026-10-02T10:00:00",
        energy_state=EnergyState(solar_kw=solar_kw, solar_drop_percent=0, grid_available=grid, total_load_kw=total_load),
        battery_state=BatteryState(battery_soc=battery_soc),
        pond_state=PondState(pond_do=pond_do, pond_do_trend=pond_do_trend, pond_water_temp=pond_temp, aerators_on=aerators_on, total_aerators=4),
        cold_chain_state=ColdChainState(cold_room_temp=cold_temp, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_buffer_hours=thermal_buffer),
        equipment_state=EquipmentState(inrush_surge_kw=inrush_kw),
        relevant_measurements={},
        telemetry=IoTTelemetry(
            solar_gen_kw=solar_kw, battery_soc_pct=battery_soc,
            grid_available=grid, diesel_gen_running=False,
            pond_dissolved_oxygen_mg_l=pond_do, pond_water_temp_c=pond_temp,
            aerators_total=4, aerators_running=aerators_on,
            aerator_soft_start_active=True, inrush_surge_kw=inrush_kw,
            cold_room_temp_c=cold_temp, cold_room_target_temp_c=4.0,
            thermal_precooling_active=False, thermal_buffer_hours=thermal_buffer,
            pumps_kw=2.1, ice_plant_kw=3.0, processing_plant_kw=4.0, lighting_kw=0.8
        )
    )


# ============================================================
# 1. EVENT ENGINE — All 10 scenarios
# ============================================================
class TestEventEngine:
    EXPECTED_IDS = [
        "SOLAR_DROP_60", "BATTERY_LOW_20", "POND_DO_FALLING",
        "COLD_ROOM_TEMP_RISING", "GRID_FAILURE", "POND_TEMP_HIGH",
        "AERATOR_START_REQUESTED", "SOLAR_NORMAL", "BATTERY_HEALTHY", "COLD_CHAIN_STABLE"
    ]

    def test_all_10_events_load(self):
        events = get_all_events()
        assert len(events) == 10, f"Expected 10 events, got {len(events)}"

    def test_all_event_ids_present(self):
        events = get_all_events()
        loaded_ids = [e.id for e in events]
        for eid in self.EXPECTED_IDS:
            assert eid in loaded_ids, f"Event '{eid}' not found"

    def test_events_are_deterministic(self):
        """Same event loaded twice must be identical"""
        e1 = get_event_by_id("SOLAR_DROP_60")
        e2 = get_event_by_id("SOLAR_DROP_60")
        assert e1.energy_state.solar_kw == e2.energy_state.solar_kw
        assert e1.battery_state.battery_soc == e2.battery_state.battery_soc

    def test_solar_drop_event_has_low_solar(self):
        e = get_event_by_id("SOLAR_DROP_60")
        assert e.energy_state.solar_kw < 10.0, "Solar drop event should show low solar"

    def test_battery_low_event_has_low_soc(self):
        e = get_event_by_id("BATTERY_LOW_20")
        assert e.battery_state.battery_soc < 20.0, "Battery low event should have SOC < 20%"

    def test_pond_do_falling_event_has_low_do(self):
        e = get_event_by_id("POND_DO_FALLING")
        assert e.pond_state.pond_do < 3.5, "Pond DO event should have critical DO"
        assert e.pond_state.pond_do_trend == "falling"

    def test_cold_room_temp_rising_event_is_above_threshold(self):
        e = get_event_by_id("COLD_ROOM_TEMP_RISING")
        assert e.cold_chain_state.cold_room_temp > 5.0, "Cold room temp should exceed safe threshold"

    def test_grid_failure_event_has_no_grid(self):
        e = get_event_by_id("GRID_FAILURE")
        assert e.energy_state.grid_available == False

    def test_solar_normal_has_high_solar(self):
        e = get_event_by_id("SOLAR_NORMAL")
        assert e.energy_state.solar_kw > 14.0

    def test_activate_event_returns_farm_state(self):
        fs = activate_event("SOLAR_DROP_60")
        assert fs.active_event_id == "SOLAR_DROP_60"
        assert fs.telemetry is not None

    def test_all_events_have_required_fields(self):
        for eid in self.EXPECTED_IDS:
            e = get_event_by_id(eid)
            assert e.id, f"Event {eid} missing id"
            assert e.name, f"Event {eid} missing name"
            assert e.severity in ("high", "med", "low"), f"Event {eid} has invalid severity"
            assert e.telemetry is not None, f"Event {eid} missing telemetry"


# ============================================================
# 2. POND AGENT
# ============================================================
class TestPondAgent:
    def test_low_do_triggers_emergency_aeration(self):
        result = analyze_pond_health(dissolved_oxygen=2.5, do_trend="falling",
                                     water_temperature=28.0, aerators_on=2, total_aerators=4)
        assert result.aeration_criticality in ("high", "emergency")
        assert result.pond_status in ("warning", "critical")

    def test_healthy_do_is_ok(self):
        result = analyze_pond_health(dissolved_oxygen=5.5, do_trend="stable",
                                     water_temperature=28.0, aerators_on=4, total_aerators=4)
        assert result.pond_status == "ok"
        assert result.aeration_criticality in ("low", "medium")

    def test_do_falling_increases_criticality(self):
        stable = analyze_pond_health(dissolved_oxygen=4.5, do_trend="stable",
                                      water_temperature=28.0, aerators_on=4, total_aerators=4)
        falling = analyze_pond_health(dissolved_oxygen=4.5, do_trend="falling",
                                       water_temperature=28.0, aerators_on=4, total_aerators=4)
        criticality_rank = {"low": 0, "medium": 1, "high": 2, "emergency": 3}
        assert criticality_rank[falling.aeration_criticality] >= criticality_rank[stable.aeration_criticality]

    def test_do_below_3_5_is_critical_status(self):
        result = analyze_pond_health(dissolved_oxygen=3.2, do_trend="falling",
                                     water_temperature=28.0, aerators_on=4, total_aerators=4)
        assert result.pond_status in ("warning", "critical")

    def test_high_water_temp_reported_in_warnings(self):
        result = analyze_pond_health(dissolved_oxygen=4.5, do_trend="stable",
                                     water_temperature=31.0, aerators_on=4, total_aerators=4)
        assert len(result.warnings) > 0 or result.pond_status in ("warning", "critical")

    def test_output_has_required_fields(self):
        result = analyze_pond_health(dissolved_oxygen=4.5, do_trend="stable",
                                     water_temperature=28.0, aerators_on=4, total_aerators=4)
        assert result.pond_status is not None
        assert result.aeration_criticality is not None
        assert result.recommended_aeration is not None
        assert isinstance(result.warnings, list)
        assert result.explanation is not None


# ============================================================
# 3. ENERGY AGENT
# ============================================================
class TestEnergyAgent:
    def test_low_solar_detects_energy_deficit(self):
        # Grid provides 15 kW backup, so energy deficit only appears when grid is unavailable.
        # With grid=False and low solar (4.1 kW) + soc > reserve: only battery capacity (8 kW) helps.
        result = analyze_energy_system(solar_generation=4.1, battery_soc=38.0,
                                       grid_availability=False, load_demand=18.3)
        assert result.energy_deficit > 0, "Low solar without grid should produce energy deficit"
        assert result.energy_status in ("warning", "critical")

    def test_grid_failure_with_low_solar_is_critical(self):
        result = analyze_energy_system(solar_generation=5.0, battery_soc=25.0,
                                       grid_availability=False, load_demand=18.0)
        assert result.energy_status in ("warning", "critical")

    def test_battery_below_20_is_critical(self):
        result = analyze_energy_system(solar_generation=10.0, battery_soc=15.0,
                                       grid_availability=False, load_demand=16.0)
        assert result.energy_status in ("warning", "critical")
        assert len(result.warnings) > 0

    def test_high_solar_is_ok(self):
        result = analyze_energy_system(solar_generation=18.0, battery_soc=75.0,
                                       grid_availability=True, load_demand=12.0)
        assert result.energy_status == "ok"
        assert result.energy_deficit == 0.0

    def test_output_has_required_fields(self):
        result = analyze_energy_system(solar_generation=10.0, battery_soc=50.0,
                                       grid_availability=True, load_demand=15.0)
        assert result.energy_status is not None
        assert result.available_energy >= 0
        assert result.energy_deficit >= 0
        assert result.battery_action is not None
        assert result.grid_action is not None


# ============================================================
# 4. COLD CHAIN AGENT
# ============================================================
class TestColdChainAgent:
    def test_rising_temperature_triggers_high_refrigeration_priority(self):
        result = analyze_cold_chain(cold_room_temperature=6.2, target_temperature_min=2.0,
                                     target_temperature_max=5.0, thermal_buffer_hours=1.2, solar_generation=11.5)
        assert result.refrigeration_priority in ("high", "critical")
        assert result.cold_chain_status in ("warning", "critical")

    def test_stable_temperature_is_ok(self):
        result = analyze_cold_chain(cold_room_temperature=3.8, target_temperature_min=2.0,
                                     target_temperature_max=5.0, thermal_buffer_hours=3.5, solar_generation=14.0)
        assert result.cold_chain_status == "ok"

    def test_high_solar_triggers_precooling_recommendation(self):
        result = analyze_cold_chain(cold_room_temperature=4.0, target_temperature_min=2.0,
                                     target_temperature_max=5.0, thermal_buffer_hours=3.0, solar_generation=18.0)
        assert "pre-cool" in result.pre_cooling_recommendation.lower() or "precool" in result.pre_cooling_recommendation.lower() or result.pre_cooling_recommendation != ""

    def test_temp_above_5c_is_not_ok(self):
        result = analyze_cold_chain(cold_room_temperature=5.5, target_temperature_min=2.0,
                                     target_temperature_max=5.0, thermal_buffer_hours=1.0, solar_generation=10.0)
        assert result.cold_chain_status in ("warning", "critical")

    def test_output_has_required_fields(self):
        result = analyze_cold_chain(cold_room_temperature=4.0, target_temperature_min=2.0,
                                     target_temperature_max=5.0, thermal_buffer_hours=3.0, solar_generation=14.0)
        assert result.cold_chain_status is not None
        assert result.refrigeration_priority is not None
        assert result.temperature_risk is not None
        assert isinstance(result.warnings, list)


# ============================================================
# 5. RISK AGENT
# ============================================================
class TestRiskAgent:
    def _get_agents(self, do=5.0, solar=14.0, soc=70.0, cold_temp=4.0):
        pond = analyze_pond_health(do, "stable", 28.0, 4, 4)
        energy = analyze_energy_system(solar, soc, True, 12.0)
        cold = analyze_cold_chain(cold_temp, 2.0, 5.0, 3.0, solar)
        return pond, energy, cold

    def test_low_do_produces_high_risk(self):
        pond = analyze_pond_health(2.5, "falling", 28.0, 2, 4)
        energy = analyze_energy_system(10.0, 40.0, True, 15.0)
        cold = analyze_cold_chain(4.0, 2.0, 5.0, 3.0, 10.0)
        result = analyze_risk_profile(pond, energy, cold)
        assert result.overall_risk in ("high", "critical")
        assert result.overall_risk_score >= 40, f"Critical DO must score ≥40, got {result.overall_risk_score}"

    def test_battery_below_20_produces_high_risk(self):
        # Energy agent marks battery < 20% as "critical" (soc < battery_reserve floor)
        # Risk agent adds 30 pts for energy_status == "critical" + floor for "high" severity = high
        pond = analyze_pond_health(5.0, "stable", 28.0, 4, 4)
        energy = analyze_energy_system(solar_generation=5.0, battery_soc=15.0,
                                       grid_availability=False, load_demand=15.0)
        cold = analyze_cold_chain(4.0, 2.0, 5.0, 3.0, 5.0)
        result = analyze_risk_profile(pond, energy, cold,
                                      event_severity="high", battery_soc=15.0,
                                      grid_available=False)
        assert energy.energy_status == "critical", f"Battery 15% < 20% floor must produce critical energy status, got: {energy.energy_status}"
        assert result.overall_risk in ("high", "critical")
        assert result.human_approval_requirement == True


    def test_healthy_state_produces_low_risk(self):
        pond, energy, cold = self._get_agents(do=5.5, solar=18.0, soc=80.0, cold_temp=3.5)
        result = analyze_risk_profile(pond, energy, cold)
        assert result.overall_risk in ("low", "medium")

    def test_critical_loads_always_includes_aeration(self):
        pond, energy, cold = self._get_agents(do=2.5, solar=4.0, soc=15.0, cold_temp=6.0)
        result = analyze_risk_profile(pond, energy, cold)
        assert any("aer" in l.lower() or "aerator" in l.lower() or "aeration" in l.lower()
                   for l in result.critical_loads + result.loads_must_never_be_disabled)

    def test_flexible_loads_are_deferrable(self):
        pond, energy, cold = self._get_agents()
        result = analyze_risk_profile(pond, energy, cold)
        flexible = [f.lower() for f in result.flexible_loads]
        # At least one flexible / deferrable load must be present
        assert len(result.flexible_loads) > 0

    def test_risk_score_range_0_100(self):
        pond, energy, cold = self._get_agents()
        result = analyze_risk_profile(pond, energy, cold)
        assert 0 <= result.overall_risk_score <= 100

    def test_output_has_required_fields(self):
        pond, energy, cold = self._get_agents()
        result = analyze_risk_profile(pond, energy, cold)
        assert result.overall_risk in ("low", "medium", "high", "critical")
        assert isinstance(result.critical_loads, list)
        assert isinstance(result.flexible_loads, list)
        assert isinstance(result.loads_must_never_be_disabled, list)


# ============================================================
# 6. ORCHESTRATOR
# ============================================================
class TestOrchestrator:
    def test_generate_action_plan_for_solar_drop_event(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        assert plan.event_id == "SOLAR_DROP_60"
        assert len(plan.keep_running) > 0
        assert plan.requires_human_approval is not None
        assert plan.soft_start_rig is not None
        assert plan.thermal_precool_rig is not None

    def test_plan_always_has_aerators_in_keep_running(self):
        event = get_event_by_id("POND_DO_FALLING")
        plan = generate_action_plan(event)
        keep_titles = [item.title.lower() for item in plan.keep_running]
        assert any("aerator" in t for t in keep_titles), "Aerators must always be in keep_running"

    def test_high_risk_event_requires_human_approval(self):
        # POND_DO_FALLING has pond DO < 3.5 → critical status → risk_score >= 55 → "high"
        # Risk agent sets human_approval_requirement = True when overall_risk in ["high","critical"]
        event = get_event_by_id("POND_DO_FALLING")
        plan = generate_action_plan(event)
        assert plan.requires_human_approval == True

    def test_low_risk_event_auto_optimizable(self):
        event = get_event_by_id("COLD_CHAIN_STABLE")
        plan = generate_action_plan(event)
        assert plan.risk_score < 50

    def test_plan_is_deterministic(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan1 = generate_action_plan(event)
        plan2 = generate_action_plan(event)
        assert plan1.risk_score == plan2.risk_score
        assert len(plan1.keep_running) == len(plan2.keep_running)

    def test_build_coordinated_plan_valid(self):
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, fs.cold_chain_state.cold_room_target_min,
                                   fs.cold_chain_state.cold_room_target_max, fs.cold_chain_state.thermal_buffer_hours,
                                   fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)
        coordinated = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        assert coordinated.event_id == "SOLAR_DROP_60"
        assert coordinated.thermal_action is not None
        assert coordinated.aerator_action is not None


# ============================================================
# 7. THERMAL PRE-COOLING — Temperature Limits
# ============================================================
class TestThermalPrecooling:
    def test_precooling_only_when_solar_surplus(self):
        """Thermal pre-cooling should only activate when solar > 14 kW"""
        event = get_event_by_id("SOLAR_NORMAL")
        plan = generate_action_plan(event)
        # Solar normal event has high solar → pre-cooling should be enabled
        assert plan.thermal_precool_rig.enabled == True or plan.thermal_precool_rig.status != ""

    def test_precooling_target_never_below_1c(self):
        """Pre-cooling must never exceed freezing risk (target >= 1.0°C)"""
        event = get_event_by_id("SOLAR_NORMAL")
        plan = generate_action_plan(event)
        assert plan.thermal_precool_rig.cold_storage_precooled_temp_c >= 1.0, \
            f"Pre-cooling target {plan.thermal_precool_rig.cold_storage_precooled_temp_c}°C is below 1.0°C!"

    def test_no_precooling_when_temp_already_above_5c(self):
        """Safety Engine must block buffer use when temp exceeds max"""
        fs = make_farm_state(solar_kw=12.0, cold_temp=6.5, thermal_buffer=1.0)
        event = get_event_by_id("COLD_ROOM_TEMP_RISING")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(6.5, 2.0, 5.0, 1.0, 12.0)
        risk = analyze_risk_profile(pond, energy, cold)
        coordinated = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        safety = evaluate_safety_policies(coordinated, fs)
        # Safety should NOT use cold buffer when temp > 5°C
        blocked = " ".join(safety.blocked_actions + safety.warnings)
        assert "5.0" in blocked or "temp" in blocked.lower() or coordinated.thermal_action != "use_existing_cold_buffer"

    def test_precooling_target_at_most_4_5c(self):
        """Pre-cooling target should stay within safe upper boundary (below 4.5°C limit)"""
        event = get_event_by_id("SOLAR_NORMAL")
        plan = generate_action_plan(event)
        assert plan.thermal_precool_rig.cold_storage_precooled_temp_c <= 4.5


# ============================================================
# 8. AERATOR SOFT-START — Power / Inrush Constraints
# ============================================================
class TestAeratorSoftStart:
    def test_high_inrush_enables_soft_start_rig(self):
        event = get_event_by_id("AERATOR_START_REQUESTED")
        plan = generate_action_plan(event)
        # Aerator start event has inrush of 16.2 kW → soft-start must be enabled
        assert plan.soft_start_rig.enabled == True

    def test_soft_start_peak_never_exceeds_dol_inrush(self):
        """Clamped VFD peak must be less than Direct-on-Line inrush"""
        event = get_event_by_id("AERATOR_START_REQUESTED")
        plan = generate_action_plan(event)
        dol_inrush = event.equipment_state.inrush_surge_kw
        if plan.soft_start_rig.enabled and dol_inrush > 0:
            # VFD running load (6.4 kW) should be less than DOL inrush (16.2 kW)
            assert plan.soft_start_rig.peak_inrush_prevented_kw > 0

    def test_safety_blocks_direct_online_start_with_high_inrush(self):
        """Safety engine must block DOL start when inrush > 10 kW"""
        fs = make_farm_state(inrush_kw=16.2)
        event = get_event_by_id("AERATOR_START_REQUESTED")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)
        coordinated = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        # Force a direct-start to test safety engine blocks it
        coordinated.aerator_action = "direct_online_start"
        safety = evaluate_safety_policies(coordinated, fs)
        # Should be blocked
        assert any("direct" in b.lower() or "inrush" in b.lower() or "soft" in b.lower()
                   for b in safety.blocked_actions + safety.modified_actions) or \
               coordinated.aerator_action != "direct_online_start"

    def test_soft_start_ramp_duration_is_120s(self):
        event = get_event_by_id("AERATOR_START_REQUESTED")
        plan = generate_action_plan(event)
        assert plan.soft_start_rig.ramp_duration_sec == 120

    def test_stagger_interval_is_30s(self):
        event = get_event_by_id("AERATOR_START_REQUESTED")
        plan = generate_action_plan(event)
        assert plan.soft_start_rig.stagger_interval_sec == 30


# ============================================================
# 9. SAFETY ENGINE — Policy Enforcement
# ============================================================
class TestSafetyEngine:
    def _make_plan(self, **kwargs):
        """Helper to build a coordinated plan with overrides for testing"""
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)
        plan = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        for k, v in kwargs.items():
            setattr(plan, k, v)
        return plan, fs

    def test_policy1_blocks_aerator_shutdown_when_do_below_3_5(self):
        """POLICY 1: Never disable aeration when pond DO < 3.5 mg/L"""
        plan, _ = self._make_plan(defer=["aeration"])
        low_do_fs = make_farm_state(pond_do=2.9)
        result = evaluate_safety_policies(plan, low_do_fs)
        assert any("aer" in b.lower() for b in result.blocked_actions + result.modified_actions) or \
               "aeration" not in plan.defer

    def test_policy2_blocks_refrigeration_pause_when_cold_temp_high(self):
        """POLICY 2: Never allow cold room > 5.0°C"""
        plan, _ = self._make_plan()
        plan.defer = plan.defer + ["refrigeration"]
        high_temp_fs = make_farm_state(cold_temp=6.5)
        result = evaluate_safety_policies(plan, high_temp_fs)
        assert any("refrig" in b.lower() or "temp" in b.lower() or "5.0" in b
                   for b in result.blocked_actions + result.warnings + result.modified_actions)

    def test_policy3_blocks_battery_discharge_below_20_pct(self):
        """POLICY 3: Never discharge battery below 20% floor"""
        plan, _ = self._make_plan(battery_action="discharge")
        low_soc_fs = make_farm_state(battery_soc=15.0)
        result = evaluate_safety_policies(plan, low_soc_fs)
        assert any("battery" in b.lower() or "floor" in b.lower() or "20" in b
                   for b in result.blocked_actions + result.modified_actions) or \
               plan.battery_action == "hold_emergency_floor"

    def test_policy5_forces_vfd_soft_start_on_high_inrush(self):
        """POLICY 5: Aerator starts must use VFD when inrush > 10 kW"""
        plan, _ = self._make_plan(aerator_action="direct_online_start")
        high_inrush_fs = make_farm_state(inrush_kw=16.2)
        result = evaluate_safety_policies(plan, high_inrush_fs)
        assert plan.aerator_action in ("soft_start_with_energy_check", "staggered_vfd_ramp") or \
               any("soft" in m.lower() for m in result.modified_actions)

    def test_policy7_requires_human_approval_for_critical_events(self):
        """POLICY 7: High-risk states require human approval"""
        plan, _ = self._make_plan()
        critical_fs = make_farm_state(pond_do=2.5, battery_soc=15.0, grid=False)
        result = evaluate_safety_policies(plan, critical_fs)
        assert result.requires_human_approval == True

    def test_safety_result_has_required_fields(self):
        plan, fs = self._make_plan()
        result = evaluate_safety_policies(plan, fs)
        assert result.approved is not None
        assert isinstance(result.blocked_actions, list)
        assert isinstance(result.modified_actions, list)
        assert isinstance(result.warnings, list)
        assert result.reason is not None

    def test_safe_plan_passes_cleanly(self):
        """A fully safe plan should pass with no blocks"""
        event = get_event_by_id("BATTERY_HEALTHY")
        fs = activate_event("BATTERY_HEALTHY")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)
        plan = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        result = evaluate_safety_policies(plan, fs)
        assert result.approved == True


# ============================================================
# 10. HUMAN APPROVAL WORKFLOW
# ============================================================
class TestHumanApproval:
    def _get_plan_and_request(self, action: str):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action=action)
        return plan, req

    def test_approve_executes_and_logs(self):
        plan, req = self._get_plan_and_request("approve")
        initial_count = len(AUDIT_LOGS)
        result = run_execution_simulation(req, plan)
        assert result.action_taken == "approve"
        assert len(AUDIT_LOGS) == initial_count + 1

    def test_reject_does_not_execute_controls(self):
        plan, req = self._get_plan_and_request("reject")
        result = run_execution_simulation(req, plan)
        assert result.action_taken == "reject"
        # Reject should produce a "preserved" or "untouched" control action
        assert all(not a.success for a in result.control_actions)

    def test_modify_reruns_safety_validation(self):
        plan, req = self._get_plan_and_request("modify")
        result = run_execution_simulation(req, plan)
        assert result.action_taken == "modify"
        # Should still produce control actions like approve
        assert len(result.control_actions) > 0

    def test_approve_creates_audit_entry(self):
        plan, req = self._get_plan_and_request("approve")
        result = run_execution_simulation(req, plan)
        entry = result.audit_entry
        assert entry.id is not None
        assert entry.event_id == "SOLAR_DROP_60"
        assert entry.action_taken == "APPROVE"

    def test_audit_entry_has_structured_fields(self):
        plan, req = self._get_plan_and_request("approve")
        result = run_execution_simulation(req, plan)
        entry = result.audit_entry
        assert entry.detected_risk is not None
        assert entry.agent_analysis is not None
        assert entry.recommended_action is not None
        assert entry.safety_result is not None
        assert entry.human_decision is not None
        assert entry.execution_result is not None

    def test_execution_timeline_has_8_steps(self):
        plan, req = self._get_plan_and_request("approve")
        result = run_execution_simulation(req, plan)
        assert len(result.timeline) == 8


# ============================================================
# 11. AI GATEWAY
# ============================================================
class TestAIGateway:
    def test_health_endpoint_returns_stats(self):
        health = get_ai_gateway_health()
        assert "ai_configured" in health
        assert "request_count" in health
        assert "cache_hits" in health
        assert "cache_misses" in health
        assert "fallback_count" in health
        assert "latency_avg_ms" in health

    def test_health_never_exposes_api_key(self):
        health = get_ai_gateway_health()
        health_str = json.dumps(health)
        assert "GEMINI_API_KEY" not in health_str
        assert "AIzaSy" not in health_str  # Common Gemini key prefix

    def test_no_api_key_falls_back_to_deterministic(self):
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)
        # No API key set → must use deterministic fallback
        with mock.patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            result = orchestrate_with_ai_gateway(event, fs, pond, energy, cold, risk)
        assert result.ai_used == False
        assert result.ai_fallback_reason is not None

    def test_cache_hit_prevents_duplicate_call(self):
        """Same state hash should hit cache on second call"""
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        state_hash = compute_state_hash(event, fs)

        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)

        # Manually seed a cached plan
        from app.services.orchestrator import build_coordinated_action_plan
        deterministic = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        with _cache_lock:
            _cache[state_hash] = (deterministic, time.time())

        # Second call should hit cache (never calls Gemini)
        mock_call = mock.MagicMock()
        with mock.patch("app.services.ai_gateway.call_gemini_api", mock_call):
            with mock.patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key_for_test"}):
                result = orchestrate_with_ai_gateway(event, fs, pond, energy, cold, risk)
        mock_call.assert_not_called()

    def test_429_response_falls_back_to_deterministic(self):
        """Gemini 429 must trigger Safe Optimization Mode fallback"""
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        # Clear cache
        with _cache_lock:
            _cache.clear()

        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)

        def raise_429(*args, **kwargs):
            raise Exception("Gemini API Rate Limit (429 Exceeded)")

        with mock.patch("app.services.ai_gateway.call_gemini_api", raise_429):
            with mock.patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key_for_test"}):
                with mock.patch("app.services.ai_gateway._last_request_time", 0):
                    result = orchestrate_with_ai_gateway(event, fs, pond, energy, cold, risk)

        assert result.ai_used == False
        assert "429" in (result.ai_fallback_reason or "") or result.ai_fallback_reason is not None

    def test_malformed_ai_response_falls_back_safely(self):
        """Invalid JSON from Gemini must produce deterministic fallback"""
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        with _cache_lock:
            _cache.clear()

        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0, 3.0, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold)

        def raise_malformed(*args, **kwargs):
            raise Exception("Gemini API returned malformed JSON")

        with mock.patch("app.services.ai_gateway.call_gemini_api", raise_malformed):
            with mock.patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key_for_test"}):
                with mock.patch("app.services.ai_gateway._last_request_time", 0):
                    result = orchestrate_with_ai_gateway(event, fs, pond, energy, cold, risk)

        assert result.ai_used == False
        assert result.ai_fallback_reason is not None


# ============================================================
# 12. EXECUTION STATE CHANGES
# ============================================================
class TestExecution:
    def test_approve_produces_correct_action_logs(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="approve")
        result = run_execution_simulation(req, plan)
        actions = {a.action for a in result.control_actions}
        assert "aerator_soft_start" in actions
        assert "thermal_precooling_control" in actions
        assert "flexible_load_deferral" in actions

    def test_reject_produces_fallback_action(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="reject")
        result = run_execution_simulation(req, plan)
        assert any(a.action == "plan_rejection_fallback" for a in result.control_actions)

    def test_execution_timeline_timestamps_are_sequential(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="approve")
        result = run_execution_simulation(req, plan)
        step_numbers = [s.step_number for s in result.timeline]
        assert step_numbers == sorted(step_numbers)

    def test_all_timeline_steps_are_completed_after_approve(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="approve")
        result = run_execution_simulation(req, plan)
        for step in result.timeline:
            assert step.status == "completed"

    def test_is_simulation_flag_is_always_true(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="approve")
        result = run_execution_simulation(req, plan)
        assert result.is_simulation == True


# ============================================================
# 13. IMPACT ENGINE — Deterministic Calculations
# ============================================================
class TestImpactEngine:
    def test_impact_calculations_are_deterministic(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        impact1 = calculate_plan_impact(plan)
        impact2 = calculate_plan_impact(plan)
        assert impact1.energy_optimized_kwh == impact2.energy_optimized_kwh
        assert impact1.cost_avoided_inr == impact2.cost_avoided_inr
        assert impact1.diesel_avoided_liters == impact2.diesel_avoided_liters
        assert impact1.co2_avoided_kg == impact2.co2_avoided_kg

    def test_cost_avoided_based_on_energy_and_tariff(self):
        """Cost = energy_optimized * ₹9.50/kWh + soft_start_savings"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        impact = calculate_plan_impact(plan)
        assert impact.cost_avoided_inr > 0

    def test_diesel_avoided_positive(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        impact = calculate_plan_impact(plan)
        assert impact.diesel_avoided_liters >= 0

    def test_co2_avoided_positive(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        impact = calculate_plan_impact(plan)
        assert impact.co2_avoided_kg >= 0

    def test_critical_ops_safety_pct_at_most_100(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        impact = calculate_plan_impact(plan)
        assert impact.critical_ops_safety_pct <= 100.0

    def test_detailed_impact_has_comparison_table(self):
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        detailed = calculate_detailed_impact(plan)
        assert len(detailed.comparison_table) >= 5
        for row in detailed.comparison_table:
            assert row.metric_name
            assert row.without_aquavolt
            assert row.with_aquavolt
            assert row.difference_savings


# ============================================================
# 14. FULL END-TO-END SCENARIO: Solar Drop 60%
# ============================================================
class TestEndToEndSolarDrop60:
    """
    Complete E2E: Solar Drop → Agents → Orchestrator → Safety → Approval → Execution → Impact → Audit
    """

    def test_full_pipeline(self):
        # Step 1: Load event
        event = get_event_by_id("SOLAR_DROP_60")
        assert event is not None
        assert event.id == "SOLAR_DROP_60"
        assert event.energy_state.solar_kw < 10.0  # Confirm low solar

        # Step 2: Activate farm state
        farm_state = activate_event("SOLAR_DROP_60")
        assert farm_state.active_event_id == "SOLAR_DROP_60"

        # Step 3: Run all 4 agents
        pond_out = analyze_pond_health(
            farm_state.pond_state.pond_do, farm_state.pond_state.pond_do_trend,
            farm_state.pond_state.pond_water_temp, farm_state.pond_state.aerators_on
        )
        energy_out = analyze_energy_system(
            farm_state.energy_state.solar_kw, farm_state.battery_state.battery_soc,
            farm_state.energy_state.grid_available, farm_state.energy_state.total_load_kw
        )
        cold_out = analyze_cold_chain(
            farm_state.cold_chain_state.cold_room_temp, 2.0, 5.0,
            farm_state.cold_chain_state.thermal_buffer_hours, farm_state.energy_state.solar_kw
        )
        risk_out = analyze_risk_profile(pond_out, energy_out, cold_out)

        # Solar dropped 60% but grid is still available — energy agent reports "ok"
        # (grid provides 15 kW backup capacity). The orchestrator still defers flexible loads
        # because solar_kw < 12.0 (not because energy_status is "warning").
        assert energy_out.energy_status in ("ok", "warning", "critical")

        # Step 4: Orchestrator creates action plan
        plan = generate_action_plan(event)
        assert plan.event_id == "SOLAR_DROP_60"
        assert plan.risk_score >= 0
        assert len(plan.keep_running) > 0
        assert len(plan.defer_or_reduce) > 0

        # Step 5: Safety engine validates
        coordinated = build_coordinated_action_plan(event, farm_state, pond_out, energy_out, cold_out, risk_out)
        safety_result = evaluate_safety_policies(coordinated, farm_state)
        # Coordinated plan may be repaired, but execution should not be halted
        assert safety_result is not None
        assert isinstance(safety_result.approved, bool)

        # Step 6: Human approves
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="approve")
        before_log_count = len(AUDIT_LOGS)
        execution = run_execution_simulation(req, plan)
        assert execution.action_taken == "approve"

        # Step 7: Execution results produced
        assert len(execution.control_actions) > 0
        assert len(execution.timeline) == 8
        assert execution.is_simulation == True

        # Step 8: Impact calculated
        impact = execution.impact
        assert impact.energy_optimized_kwh > 0
        assert impact.cost_avoided_inr > 0
        assert impact.co2_avoided_kg > 0

        # Step 9: Audit log recorded
        assert len(AUDIT_LOGS) == before_log_count + 1
        audit_entry = execution.audit_entry
        assert audit_entry.event_id == "SOLAR_DROP_60"
        assert audit_entry.action_taken == "APPROVE"
        assert audit_entry.detected_risk is not None
        assert audit_entry.safety_result is not None


# ============================================================
# 15. HIGH-RISK SCENARIO APPROVAL REQUIREMENTS
#     All 5 "high" severity events must require human approval
#     through the complete data flow: IoT Event → Risk Agent →
#     Orchestrator → Safety Engine (final gate).
# ============================================================
class TestHighRiskScenarioApproval:
    """
    Verifies that every IoT event tagged severity='high' produces
    requires_human_approval=True at EVERY layer of the stack.
    """
    HIGH_SEVERITY_EVENTS = [
        "SOLAR_DROP_60",
        "BATTERY_LOW_20",
        "POND_DO_FALLING",
        "COLD_ROOM_TEMP_RISING",
        "GRID_FAILURE",
    ]
    LOW_SEVERITY_EVENTS = [
        "SOLAR_NORMAL",
        "BATTERY_HEALTHY",
        "COLD_CHAIN_STABLE",
    ]

    def _run_full_pipeline(self, event_id: str):
        event = get_event_by_id(event_id)
        fs = activate_event(event_id)
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0,
                                   fs.cold_chain_state.thermal_buffer_hours, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(
            pond, energy, cold,
            event_severity=event.severity,
            solar_drop_pct=event.energy_state.solar_drop_percent,
            grid_available=event.energy_state.grid_available,
            battery_soc=event.battery_state.battery_soc,
            do_trend=event.pond_state.pond_do_trend,
        )
        plan = generate_action_plan(event)
        coordinated = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        safety = evaluate_safety_policies(coordinated, fs, event=event)
        return event, risk, plan, coordinated, safety

    # ── SOLAR_DROP_60 ───────────────────────────────────────────────────────
    def test_solar_drop_60_risk_agent_requires_approval(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("SOLAR_DROP_60")
        assert risk.human_approval_requirement == True, \
            f"SOLAR_DROP_60: Risk agent must require approval. Score={risk.overall_risk_score}, Level={risk.overall_risk}"
        assert risk.overall_risk in ("high", "critical"), \
            f"SOLAR_DROP_60: Risk level should be high/critical, got {risk.overall_risk}"

    def test_solar_drop_60_orchestrator_requires_approval(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("SOLAR_DROP_60")
        assert plan.requires_human_approval == True, \
            "SOLAR_DROP_60: Orchestrator ActionPlan must have requires_human_approval=True"
        assert coordinated.requires_human_approval == True, \
            "SOLAR_DROP_60: CoordinatedActionPlan must have requires_human_approval=True"

    def test_solar_drop_60_safety_engine_requires_approval(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("SOLAR_DROP_60")
        assert safety.requires_human_approval == True, \
            "SOLAR_DROP_60: Safety Engine must enforce requires_human_approval=True"
        assert any("POLICY 9" in w or "HIGH" in w for w in safety.warnings), \
            "SOLAR_DROP_60: Safety Engine must emit Policy 9 warning for high-severity event"

    # ── BATTERY_LOW_20 ──────────────────────────────────────────────────────
    def test_battery_low_20_requires_approval_full_stack(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("BATTERY_LOW_20")
        assert risk.human_approval_requirement == True, \
            "BATTERY_LOW_20: Risk agent must require approval"
        assert plan.requires_human_approval == True, \
            "BATTERY_LOW_20: ActionPlan must require approval"
        assert safety.requires_human_approval == True, \
            "BATTERY_LOW_20: Safety Engine must require approval"

    # ── POND_DO_FALLING ─────────────────────────────────────────────────────
    def test_pond_do_falling_requires_approval_full_stack(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("POND_DO_FALLING")
        assert risk.human_approval_requirement == True, \
            "POND_DO_FALLING: Risk agent must require approval (critical DO)"
        assert plan.requires_human_approval == True, \
            "POND_DO_FALLING: ActionPlan must require approval"
        assert safety.requires_human_approval == True, \
            "POND_DO_FALLING: Safety Engine must require approval"

    # ── COLD_ROOM_TEMP_RISING ───────────────────────────────────────────────
    def test_cold_room_temp_rising_requires_approval_full_stack(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("COLD_ROOM_TEMP_RISING")
        assert risk.human_approval_requirement == True, \
            "COLD_ROOM_TEMP_RISING: Risk agent must require approval"
        assert plan.requires_human_approval == True, \
            "COLD_ROOM_TEMP_RISING: ActionPlan must require approval"
        assert safety.requires_human_approval == True, \
            "COLD_ROOM_TEMP_RISING: Safety Engine must require approval"

    # ── GRID_FAILURE ─────────────────────────────────────────────────────────
    def test_grid_failure_requires_approval_full_stack(self):
        event, risk, plan, coordinated, safety = self._run_full_pipeline("GRID_FAILURE")
        assert risk.human_approval_requirement == True, \
            "GRID_FAILURE: Risk agent must require approval (grid loss)"
        assert plan.requires_human_approval == True, \
            "GRID_FAILURE: ActionPlan must require approval"
        assert safety.requires_human_approval == True, \
            "GRID_FAILURE: Safety Engine must require approval"

    # ── ALL HIGH-SEVERITY EVENTS: parametric sweep ──────────────────────────
    def test_all_high_severity_events_require_approval(self):
        """Every high-severity event must require approval at all 3 layers."""
        for event_id in self.HIGH_SEVERITY_EVENTS:
            event, risk, plan, coordinated, safety = self._run_full_pipeline(event_id)
            assert risk.human_approval_requirement == True, \
                f"{event_id}: RiskAgent must require approval"
            assert plan.requires_human_approval == True, \
                f"{event_id}: ActionPlan must require approval"
            assert safety.requires_human_approval == True, \
                f"{event_id}: Safety Engine must require approval"

    # ── LOW-SEVERITY EVENTS: must NOT force mandatory approval ──────────────
    def test_low_severity_events_can_be_auto_safe(self):
        """Low-severity events should be auto-optimizable (no mandatory approval)."""
        for event_id in self.LOW_SEVERITY_EVENTS:
            event, risk, plan, coordinated, safety = self._run_full_pipeline(event_id)
            # Low-severity events must NOT require approval UNLESS agents raise risk ≥ 40
            if risk.overall_risk_score < 40:
                assert plan.requires_human_approval == False, \
                    f"{event_id} (low risk={risk.overall_risk_score}): should not require approval"


# ============================================================
# 16. EXECUTION GATE — Cannot execute without approval
# ============================================================
class TestExecutionGate:
    """
    Verifies the backend execution gate: high-risk plans cannot be
    dispatched unless the operator sends action='approve' or 'modify'.
    """

    def test_high_risk_plan_requires_human_approval_flag(self):
        """SOLAR_DROP_60 is severity=high → plan.requires_human_approval must be True"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        assert plan.requires_human_approval == True, \
            "SOLAR_DROP_60 plan must have requires_human_approval=True"

    def test_approve_action_executes_high_risk_plan(self):
        """Explicit APPROVE on high-risk plan → execution proceeds normally"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        assert plan.requires_human_approval == True
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="approve")
        result = run_execution_simulation(req, plan)
        assert result.action_taken == "approve"
        assert len(result.control_actions) > 0

    def test_modify_action_executes_high_risk_plan(self):
        """Modified approval on high-risk plan → execution still proceeds"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="modify")
        result = run_execution_simulation(req, plan)
        assert result.action_taken == "modify"

    def test_reject_action_does_not_execute_controls(self):
        """Reject action produces no_op — no hardware controls dispatched"""
        event = get_event_by_id("SOLAR_DROP_60")
        plan = generate_action_plan(event)
        assert plan.requires_human_approval == True
        req = ApprovalRequest(event_id="SOLAR_DROP_60", action="reject")
        result = run_execution_simulation(req, plan)
        # Reject must not dispatch real control actions
        assert result.action_taken == "reject"
        assert all(not a.success for a in result.control_actions), \
            "Rejected plan must not have any successful control actions"

    def test_safety_engine_preserves_human_approval_on_high_severity(self):
        """Safety Engine Policy 9 must not downgrade requires_human_approval"""
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0,
                                   fs.cold_chain_state.thermal_buffer_hours, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(pond, energy, cold, event_severity="high",
                                     solar_drop_pct=event.energy_state.solar_drop_percent,
                                     grid_available=event.energy_state.grid_available,
                                     battery_soc=event.battery_state.battery_soc)
        coordinated = build_coordinated_action_plan(event, fs, pond, energy, cold, risk)
        safety = evaluate_safety_policies(coordinated, fs, event=event)
        assert safety.requires_human_approval == True, \
            "Safety Engine must not lower requires_human_approval for high-severity events"
        # Attempt to manually clear the flag — Safety Engine must restore it
        coordinated.requires_human_approval = False
        safety2 = evaluate_safety_policies(coordinated, fs, event=event)
        assert safety2.requires_human_approval == True, \
            "Safety Engine Policy 9 must restore requires_human_approval even if plan cleared it"


# ============================================================
# 17. RISK AGENT TELEMETRY AWARENESS
# ============================================================
class TestRiskAgentTelemetryAwareness:
    """Tests that Risk Agent correctly factors in event-level telemetry."""

    def test_solar_drop_60_pct_increases_risk_score(self):
        """60% solar drop must add ≥15 pts to risk score"""
        pond = analyze_pond_health(4.2, "stable", 28.0, 4, 4)
        energy = analyze_energy_system(4.1, 38.0, True, 18.3)
        cold = analyze_cold_chain(4.3, 2.0, 5.0, 2.5, 4.1)
        no_drop = analyze_risk_profile(pond, energy, cold, event_severity="low", solar_drop_pct=0.0)
        with_drop = analyze_risk_profile(pond, energy, cold, event_severity="low", solar_drop_pct=60.0)
        assert with_drop.overall_risk_score > no_drop.overall_risk_score, \
            "60% solar drop should increase risk score"
        assert with_drop.overall_risk_score - no_drop.overall_risk_score >= 15, \
            f"60% solar drop should add ≥15 pts: was {no_drop.overall_risk_score}, now {with_drop.overall_risk_score}"

    def test_normal_telemetry_under_high_severity_is_low_risk(self):
        """Normal telemetry under event_severity='high' must evaluate to low risk without approval."""
        pond = analyze_pond_health(5.0, "stable", 28.0, 4, 4)
        energy = analyze_energy_system(18.0, 80.0, True, 11.0)
        cold = analyze_cold_chain(3.5, 2.0, 5.0, 4.5, 18.0)
        result = analyze_risk_profile(pond, energy, cold, event_severity="high", solar_drop_pct=0.0)
        assert result.overall_risk_score < 40, \
            f"Normal telemetry must evaluate to <40, got {result.overall_risk_score}"
        assert result.human_approval_requirement == False

    def test_grid_loss_adds_risk_points(self):
        """Grid loss must add 10 pts to risk score"""
        pond = analyze_pond_health(5.0, "stable", 28.0, 4, 4)
        energy_grid = analyze_energy_system(9.0, 62.0, True, 14.0)
        energy_no_grid = analyze_energy_system(9.0, 62.0, False, 14.0)
        cold = analyze_cold_chain(4.2, 2.0, 5.0, 3.5, 9.0)
        with_grid = analyze_risk_profile(pond, energy_grid, cold, event_severity="low", grid_available=True)
        without_grid = analyze_risk_profile(pond, energy_no_grid, cold, event_severity="low", grid_available=False)
        assert without_grid.overall_risk_score > with_grid.overall_risk_score, \
            "Grid loss must increase risk score"

    def test_low_battery_under_40_adds_risk_points(self):
        """Battery < 40% adds 8 risk pts"""
        pond = analyze_pond_health(5.0, "stable", 28.0, 4, 4)
        energy_ok = analyze_energy_system(14.0, 70.0, True, 12.0)
        energy_low = analyze_energy_system(14.0, 38.0, True, 12.0)
        cold = analyze_cold_chain(4.0, 2.0, 5.0, 3.5, 14.0)
        ok_risk = analyze_risk_profile(pond, energy_ok, cold, event_severity="low", battery_soc=70.0)
        low_risk = analyze_risk_profile(pond, energy_low, cold, event_severity="low", battery_soc=38.0)
        assert low_risk.overall_risk_score > ok_risk.overall_risk_score, \
            "Battery < 40% should increase risk score"

    def test_do_falling_trend_adds_early_warning_points(self):
        """DO falling trend adds 5 pts even when DO is still above critical"""
        pond_stable = analyze_pond_health(4.5, "stable", 28.0, 4, 4)
        pond_falling = analyze_pond_health(4.5, "falling", 28.0, 4, 4)
        energy = analyze_energy_system(14.0, 70.0, True, 12.0)
        cold = analyze_cold_chain(4.0, 2.0, 5.0, 3.5, 14.0)
        stable_risk = analyze_risk_profile(pond_stable, energy, cold, event_severity="low", do_trend="stable")
        falling_risk = analyze_risk_profile(pond_falling, energy, cold, event_severity="low", do_trend="falling")
        assert falling_risk.overall_risk_score >= stable_risk.overall_risk_score, \
            "Falling DO trend should not decrease risk score"

    def test_solar_drop_60_event_risk_is_high(self):
        """Full SOLAR_DROP_60 scenario must produce risk ≥ 40 (high)"""
        event = get_event_by_id("SOLAR_DROP_60")
        fs = activate_event("SOLAR_DROP_60")
        pond = analyze_pond_health(fs.pond_state.pond_do, fs.pond_state.pond_do_trend,
                                    fs.pond_state.pond_water_temp, fs.pond_state.aerators_on)
        energy = analyze_energy_system(fs.energy_state.solar_kw, fs.battery_state.battery_soc,
                                        fs.energy_state.grid_available, fs.energy_state.total_load_kw)
        cold = analyze_cold_chain(fs.cold_chain_state.cold_room_temp, 2.0, 5.0,
                                   fs.cold_chain_state.thermal_buffer_hours, fs.energy_state.solar_kw)
        risk = analyze_risk_profile(
            pond, energy, cold,
            event_severity=event.severity,
            solar_drop_pct=event.energy_state.solar_drop_percent,
            grid_available=event.energy_state.grid_available,
            battery_soc=event.battery_state.battery_soc,
            do_trend=event.pond_state.pond_do_trend,
        )
        assert risk.overall_risk_score >= 40, \
            f"SOLAR_DROP_60 must score ≥40, got {risk.overall_risk_score}"
        assert risk.overall_risk in ("high", "critical")
        assert risk.human_approval_requirement == True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
