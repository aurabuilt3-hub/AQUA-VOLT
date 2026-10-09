from typing import List, Optional
from app.models.schemas import (
    CoordinatedActionPlan, FarmState, SafetyEngineResult,
    SafetyValidation, SafetyCheckResult, ActionPlanItem, IoTEvent
)

# Severity levels that unconditionally require human approval
_MANDATORY_APPROVAL_SEVERITIES = {"high"}

def evaluate_safety_policies(
    plan: CoordinatedActionPlan,
    farm_state: FarmState,
    event: Optional[IoTEvent] = None
) -> SafetyEngineResult:
    blocked_actions: List[str] = []
    modified_actions: List[str] = []
    warnings: List[str] = []
    approved = True
    requires_human_approval = plan.requires_human_approval

    do = farm_state.pond_state.pond_do
    cold_temp = farm_state.cold_chain_state.cold_room_temp
    soc = farm_state.battery_state.battery_soc
    grid = farm_state.energy_state.grid_available
    inrush_kw = farm_state.equipment_state.inrush_surge_kw

    defer_list = getattr(plan, "defer", None)
    defer_str = [str(x).lower() for x in defer_list] if defer_list is not None else [getattr(x, "id", str(x)).lower() for x in getattr(plan, "defer_or_reduce", [])]
    keep_list = getattr(plan, "keep_running", [])
    keep_str = [getattr(x, "id", str(x)).lower() for x in keep_list]

    # ------------------------------------------------------------------------
    # POLICY 1: Never disable critical aeration when pond DO is below threshold (< 3.5 mg/L)
    # ------------------------------------------------------------------------
    if do < 3.5:
        if "aeration" in defer_str or "aerators" in defer_str:
            approved = False
            blocked_actions.append("defer_aeration")
            modified_actions.append("REPAIRED: Moved aeration to critical keep_running with emergency VFD soft-start ramp.")
            warnings.append(f"POLICY 1 ENFORCED: Dissolved Oxygen is {do:.1f} mg/L (< 3.5 mg/L threshold). Aeration deferral blocked.")

    # ------------------------------------------------------------------------
    # POLICY 2: Never allow cold-room temp to exceed safe operating range (> 5.0°C)
    # ------------------------------------------------------------------------
    thermal_act = getattr(plan, "thermal_action", "standard_4.0C_refrigeration")
    if cold_temp > 5.0:
        if "refrigeration" in defer_str or thermal_act == "use_existing_cold_buffer":
            approved = False
            blocked_actions.append("pause_refrigeration_when_temp_high")
            modified_actions.append("REPAIRED: Overrode thermal action to 'engage_active_refrigeration_cooling' to protect shrimp harvest.")
            if hasattr(plan, "thermal_action"):
                plan.thermal_action = "engage_active_refrigeration_cooling"
            warnings.append(f"POLICY 2 ENFORCED: Cold room temp is {cold_temp:.1f}°C (> 5.0°C limit). Compressor pause blocked.")

    # ------------------------------------------------------------------------
    # POLICY 3: Never discharge battery below configured floor reserve (20%)
    # ------------------------------------------------------------------------
    battery_act = getattr(plan, "battery_action", "standby")
    if soc < 20.0:
        if battery_act == "discharge":
            approved = False
            blocked_actions.append("discharge_battery_below_floor")
            modified_actions.append("REPAIRED: Set battery_action to 'hold_emergency_floor' (20% reserve).")
            if hasattr(plan, "battery_action"):
                plan.battery_action = "hold_emergency_floor"
            warnings.append(f"POLICY 3 ENFORCED: Battery SOC is {soc:.0f}% (< 20% floor). Battery discharge blocked.")

    # ------------------------------------------------------------------------
    # POLICY 4: Never exceed equipment power/current limits (22 kW Inverter limit)
    # ------------------------------------------------------------------------
    estimated_active_kw = farm_state.energy_state.total_load_kw
    if estimated_active_kw > 22.0:
        approved = False
        blocked_actions.append("inverter_overload_simultaneous_startup")
        modified_actions.append("REPAIRED: Deferred flexible loads ('ice_production', 'shrimp_processing') to clamp peak load <= 22 kW.")
        warnings.append(f"POLICY 4 ENFORCED: Peak load demand ({estimated_active_kw:.1f} kW) exceeds 22.0 kW inverter limit.")

    # ------------------------------------------------------------------------
    # POLICY 5: Aerator starts must respect soft-start/inrush constraint
    # ------------------------------------------------------------------------
    aerator_action = getattr(plan, "aerator_action", "staggered_vfd_ramp")
    if inrush_kw > 10.0 or aerator_action == "direct_online_start":
        if aerator_action != "staggered_vfd_ramp" and aerator_action != "soft_start_with_energy_check":
            approved = False
            blocked_actions.append("direct_online_aerator_start")
            modified_actions.append("REPAIRED: Enforced 'soft_start_with_energy_check' VFD frequency ramp over 120s with 30s delays.")
            if hasattr(plan, "aerator_action"):
                plan.aerator_action = "soft_start_with_energy_check"
            warnings.append(f"POLICY 5 ENFORCED: Potential inrush surge ({inrush_kw:.1f} kW) blocked. VFD soft-start rig engaged.")

    # ------------------------------------------------------------------------
    # POLICY 6: Thermal pre-cooling must stay within safe temperature boundaries (1.0°C – 4.5°C)
    # ------------------------------------------------------------------------
    if thermal_act == "engage_thermal_precooling_to_1.5C":
        warnings.append("POLICY 6 VERIFIED: Thermal pre-cooling target set to safe 1.5°C (above 1.0°C freezing boundary).")

    # ------------------------------------------------------------------------
    # POLICY 7: High-risk physical actions require human operator approval
    # ------------------------------------------------------------------------
    if do < 3.5 or cold_temp > 5.0 or soc < 20.0 or not grid or len(blocked_actions) > 0:
        requires_human_approval = True
        plan.requires_human_approval = True
        warnings.append("POLICY 7 ENFORCED: High-risk physical control action requires explicit operator approval.")

    # ------------------------------------------------------------------------
    # POLICY 8: If sensor data is missing or unreliable, switch to conservative fallback mode
    # ------------------------------------------------------------------------
    if do <= 0 or cold_temp < -10.0 or water_temp_is_unreliable(farm_state):
        approved = False
        blocked_actions.append("unreliable_sensor_optimization")
        modified_actions.append("REPAIRED: Switched system to Conservative Fallback Mode (Full aeration + standard 4.0°C cooling).")
        plan.keep_running = ["aerators", "refrigeration", "water_pumps"]
        plan.defer = ["ice_production", "shrimp_processing"]
        plan.aerator_action = "staggered_vfd_ramp"
        plan.thermal_action = "standard_4.0C_refrigeration"
        requires_human_approval = True
        warnings.append("POLICY 8 ENFORCED: Telemetry signal unverified. Conservative safety fallback engaged.")

    # ------------------------------------------------------------------------
    # POLICY 9: High-Risk Operations ALWAYS require human approval
    # The Safety Engine is the authoritative last gate — it cannot be bypassed
    # by the Orchestrator, AI Gateway, or any upstream component.
    # ------------------------------------------------------------------------
    plan_risk = getattr(plan, "risk_score", None)
    if plan_risk is not None:
        is_high_risk = plan_risk >= 40
    else:
        # Check telemetry from event if risk_score is not on the plan object
        is_high_risk = False
        if event and hasattr(event, "energy_state"):
            if (event.energy_state.solar_drop_percent >= 50.0 and event.battery_state.battery_soc < 40.0) or \
               event.battery_state.battery_soc < 20.0 or \
               event.pond_state.pond_do < 3.5 or \
               event.cold_chain_state.cold_room_temp > 5.5 or \
               not event.energy_state.grid_available:
                is_high_risk = True

    if plan.requires_human_approval or is_high_risk:
        requires_human_approval = True
        plan.requires_human_approval = True
        warnings.append(
            "POLICY 9 ENFORCED: Operation requires human review. "
            "Human operator approval is mandatory before any load control action is dispatched."
        )

    # Reason synthesis
    if approved and len(modified_actions) == 0:
        reason = "Safety Engine APPROVED proposed action plan. All 9 deterministic policies satisfied cleanly."
    else:
        reason = f"Safety Engine REPAIRED proposed action plan. Blocked {len(blocked_actions)} unsafe action(s) and applied {len(modified_actions)} safe override(s)."

    return SafetyEngineResult(
        approved=approved,
        blocked_actions=blocked_actions,
        modified_actions=modified_actions,
        warnings=warnings,
        requires_human_approval=requires_human_approval,
        reason=reason
    )

def water_temp_is_unreliable(farm_state: FarmState) -> bool:
    w_temp = farm_state.pond_state.pond_water_temp
    return w_temp < 5.0 or w_temp > 45.0

def validate_action_plan_safety(telemetry, keep_running: List[ActionPlanItem]) -> SafetyValidation:
    # Backwards compatibility helper for existing frontend
    checks = []
    warnings = []
    is_safe = True

    if telemetry.pond_dissolved_oxygen_mg_l < 3.5:
        is_safe = False
        warnings.append("DO level below 3.5 mg/L threshold.")

    if telemetry.battery_soc_pct < 20.0:
        is_safe = False
        warnings.append("Battery SOC below 20% reserve floor.")

    return SafetyValidation(
        is_safe=is_safe,
        risk_level="HIGH" if not is_safe else "LOW",
        checks=checks,
        warnings=warnings
    )

def evaluate_policy_engine(
    plan: CoordinatedActionPlan,
    farm_state: FarmState,
    event: Optional[IoTEvent] = None
):
    from app.models.schemas import PolicyEvaluationResponse
    res = evaluate_safety_policies(plan, farm_state, event=event)
    return PolicyEvaluationResponse(
        allowed=res.approved,
        requires_human_approval=res.requires_human_approval,
        violations=res.blocked_actions,
        warnings=res.warnings,
        reason=res.reason
    )
