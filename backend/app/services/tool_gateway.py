"""AquaVolt Controlled Tool Gateway (Phase 14, inspired by AgentShield).

Enforces strict separation between Agent Recommendations and Physical Control.
Specialist agents recommend actions; ONLY the Tool Gateway can dispatch simulated
commands after validating:
  1. Tool exists in the registered tool registry.
  2. Parameters are strictly typed and bounded within safe physical ranges.
  3. Deterministic Safety Engine policies permit the action.
  4. Mandatory human operator approval has been granted for high-risk actions.
  5. The action is executed against the PS04 Digital Twin.
  6. The execution is permanently logged to the audit trail.
"""

from typing import Dict, Any, List, Optional
import datetime
from app.models.schemas import ToolCallRequest, ToolExecutionResult
from app.services.digital_twin import digital_twin
from app.governance.audit import audit_logger


# Registered Tool Definitions
REGISTERED_TOOLS = {
    "startAeratorSoftStart": {
        "description": "Engage VFD Soft-Start ramp over configured seconds with staggered motor starts",
        "parameters": {
            "ramp_seconds": {"type": "int", "min": 30, "max": 300, "default": 120},
            "stagger_seconds": {"type": "int", "min": 10, "max": 60, "default": 30}
        },
        "safety_policy": "POLICY_5",
        "risk_level": "LOW_AUTO_SAFE"
    },
    "stopAerator": {
        "description": "Stop specified aerator motors",
        "parameters": {
            "aerator_ids": {"type": "list", "default": [1, 2]}
        },
        "safety_policy": "POLICY_1",
        "risk_level": "HIGH_APPROVAL_REQUIRED"
    },
    "startPrecooling": {
        "description": "Simulate thermal pre-cooling by setting cold room setpoint to 1.5°C during solar surplus",
        "parameters": {
            "target_temp_c": {"type": "float", "min": 1.0, "max": 4.5, "default": 1.5}
        },
        "safety_policy": "POLICY_6",
        "risk_level": "LOW_AUTO_SAFE"
    },
    "reduceCoolingLoad": {
        "description": "Pause refrigeration compressor and float on cold buffer",
        "parameters": {},
        "safety_policy": "POLICY_2",
        "risk_level": "MEDIUM_APPROVAL_REQUIRED"
    },
    "pauseIceProduction": {
        "description": "Pause ice plant contactor to shed 3.0 kW load and protect battery floor",
        "parameters": {
            "duration_minutes": {"type": "int", "min": 15, "max": 180, "default": 45}
        },
        "safety_policy": "POLICY_4",
        "risk_level": "LOW_AUTO_SAFE"
    },
    "pauseProcessing": {
        "description": "Pause processing line contactor to shed 4.0 kW load",
        "parameters": {
            "duration_minutes": {"type": "int", "min": 15, "max": 240, "default": 60}
        },
        "safety_policy": "POLICY_4",
        "risk_level": "LOW_AUTO_SAFE"
    },
    "maintainBatteryReserve": {
        "description": "Set BMS discharge floor limit to protect battery reserve",
        "parameters": {
            "floor_soc_pct": {"type": "float", "min": 0.0, "max": 50.0, "default": 20.0}
        },
        "safety_policy": "POLICY_3",
        "risk_level": "CRITICAL_ENFORCED"
    }
}


def execute_tool_controlled(
    request: ToolCallRequest,
    current_pond_do: float = 4.5,
    current_cold_temp: float = 4.0,
    current_battery_soc: float = 50.0
) -> ToolExecutionResult:
    """
    Controlled tool dispatch gate.
    Validates existence, parameters, safety constraints, human approval, and executes against the twin.
    """
    tool_name = request.tool_name
    params = request.parameters or {}
    event_id = request.event_id or "MANUAL_INVOCATION"

    # Step 1: Tool Registry Check
    if tool_name not in REGISTERED_TOOLS:
        err = f"UNKNOWN TOOL: '{tool_name}' is not in the AquaVolt Tool Registry."
        audit_logger.log(
            component="Tool_Gateway",
            event_type="TOOL_EXECUTION",
            event_id=event_id,
            title=f"Blocked Unknown Tool: {tool_name}",
            summary=err,
            status="BLOCKED",
            metadata={"tool_name": tool_name, "parameters": params}
        )
        return ToolExecutionResult(
            status="BLOCKED",
            tool_name=tool_name,
            parameters=params,
            authorized_by=request.authorized_by,
            human_approved=request.human_approved,
            message=err,
            error_detail="UnknownToolError"
        )

    tool_def = REGISTERED_TOOLS[tool_name]

    # Step 2: Parameter Validation
    for p_name, p_schema in tool_def["parameters"].items():
        if p_name in params:
            val = params[p_name]
            if "min" in p_schema and val < p_schema["min"]:
                err = f"INVALID PARAMETER: '{p_name}'={val} violates minimum limit ({p_schema['min']})."
                return ToolExecutionResult(
                    status="ERROR",
                    tool_name=tool_name,
                    parameters=params,
                    authorized_by=request.authorized_by,
                    human_approved=request.human_approved,
                    message=err,
                    error_detail="ParameterBoundsError"
                )
            if "max" in p_schema and val > p_schema["max"]:
                err = f"INVALID PARAMETER: '{p_name}'={val} violates maximum limit ({p_schema['max']})."
                return ToolExecutionResult(
                    status="ERROR",
                    tool_name=tool_name,
                    parameters=params,
                    authorized_by=request.authorized_by,
                    human_approved=request.human_approved,
                    message=err,
                    error_detail="ParameterBoundsError"
                )

    # Step 3: Safety Policy Constraints Validation
    # Policy 1: Never stop aerators if DO < 3.5 mg/L
    if tool_name == "stopAerator" and current_pond_do < 3.5:
        err = f"POLICY 1 VIOLATION: Cannot stop aerators when Dissolved Oxygen ({current_pond_do:.1f} mg/L) is below safe threshold (< 3.5 mg/L)."
        audit_logger.log(
            component="Tool_Gateway",
            event_type="POLICY_VIOLATION",
            event_id=event_id,
            title="Policy 1 Hard Block",
            summary=err,
            status="BLOCKED",
            metadata={"current_pond_do": current_pond_do}
        )
        return ToolExecutionResult(
            status="BLOCKED",
            tool_name=tool_name,
            parameters=params,
            authorized_by=request.authorized_by,
            human_approved=request.human_approved,
            message=err,
            error_detail="Policy1_AerationSafetyViolation"
        )

    # Policy 2: Never reduce cooling if room temp > 5.0°C
    if tool_name == "reduceCoolingLoad" and current_cold_temp > 5.0:
        err = f"POLICY 2 VIOLATION: Cannot reduce cooling load when cold room ({current_cold_temp:.1f}°C) exceeds 5.0°C."
        return ToolExecutionResult(
            status="BLOCKED",
            tool_name=tool_name,
            parameters=params,
            authorized_by=request.authorized_by,
            human_approved=request.human_approved,
            message=err,
            error_detail="Policy2_ColdStorageSafetyViolation"
        )

    # Policy 3: Never set battery floor < 20%
    if tool_name == "maintainBatteryReserve":
        floor_soc = params.get("floor_soc_pct", 20.0)
        if floor_soc < 20.0:
            err = f"POLICY 3 VIOLATION: Battery floor reserve ({floor_soc:.0f}%) cannot be configured below the mandatory 20% floor."
            return ToolExecutionResult(
                status="BLOCKED",
                tool_name=tool_name,
                parameters=params,
                authorized_by=request.authorized_by,
                human_approved=request.human_approved,
                message=err,
                error_detail="Policy3_BatteryFloorViolation"
            )

    # Step 4: Human Approval Check for High-Risk Actions
    if tool_def["risk_level"] == "HIGH_APPROVAL_REQUIRED" and not request.human_approved:
        err = f"APPROVAL REQUIRED: Tool '{tool_name}' involves high operational risk and requires human operator sign-off before dispatch."
        audit_logger.log(
            component="Tool_Gateway",
            event_type="APPROVAL_GATED",
            event_id=event_id,
            title=f"Human Approval Required: {tool_name}",
            summary=err,
            status="PENDING_APPROVAL"
        )
        return ToolExecutionResult(
            status="BLOCKED",
            tool_name=tool_name,
            parameters=params,
            authorized_by=request.authorized_by,
            human_approved=False,
            message=err,
            error_detail="HumanApprovalRequired"
        )

    # Step 5: Execute against PS04 Digital Twin
    try:
        if tool_name == "startAeratorSoftStart":
            ramp = params.get("ramp_seconds", 120)
            stagger = params.get("stagger_seconds", 30)
            log = digital_twin.simulate_start_aerator_soft_start(ramp, stagger)
        elif tool_name == "stopAerator":
            a_ids = params.get("aerator_ids", [1, 2])
            log = digital_twin.simulate_stop_aerator(a_ids)
        elif tool_name == "startPrecooling":
            target = params.get("target_temp_c", 1.5)
            log = digital_twin.simulate_start_precooling(target)
        elif tool_name == "reduceCoolingLoad":
            log = digital_twin.simulate_reduce_cooling_load()
        elif tool_name == "pauseIceProduction":
            duration = params.get("duration_minutes", 45)
            log = digital_twin.simulate_pause_ice_production(duration)
        elif tool_name == "pauseProcessing":
            duration = params.get("duration_minutes", 60)
            log = digital_twin.simulate_pause_processing(duration)
        elif tool_name == "maintainBatteryReserve":
            floor = params.get("floor_soc_pct", 20.0)
            log = digital_twin.simulate_maintain_battery_reserve(floor)
        else:
            log = {"action": tool_name, "message": "Simulated command executed"}

        audit_logger.log(
            component="Tool_Gateway",
            event_type="TOOL_EXECUTION",
            event_id=event_id,
            title=f"Executed Tool: {tool_name}",
            summary=f"[PoC Simulated] Dispatched '{tool_name}' to PS04 Digital Twin. {log.get('simulated_impact', '')}",
            status="SUCCESS",
            metadata={"tool_name": tool_name, "parameters": params, "twin_log": log}
        )

        return ToolExecutionResult(
            status="SUCCESS",
            tool_name=tool_name,
            parameters=params,
            authorized_by=request.authorized_by,
            human_approved=request.human_approved,
            message=f"[PoC SIMULATED] Command '{tool_name}' successfully executed on PS04 Digital Twin.",
            twin_state_after=digital_twin.get_full_state()
        )

    except Exception as exc:
        err_msg = f"Digital Twin Execution Error: {str(exc)}"
        return ToolExecutionResult(
            status="ERROR",
            tool_name=tool_name,
            parameters=params,
            authorized_by=request.authorized_by,
            human_approved=request.human_approved,
            message=err_msg,
            error_detail=str(exc)
        )
