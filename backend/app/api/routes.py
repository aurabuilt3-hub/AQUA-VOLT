from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    IoTEvent, ActionPlan, CoordinatedActionPlan, ApprovalRequest, AuditLogEntry,
    CopilotQuery, CopilotResponse, FarmState, SafetyEngineResult, ExecutionSimulationResult,
    DetailedImpactMetrics, PondAgentOutput, EnergyAgentOutput, ColdChainAgentOutput, RiskAgentOutput,
    NormalizedAquaVoltState, PolicyEvaluationResponse, ToolCallRequest, ToolExecutionResult,
    AnalyzeRequest, UnifiedAnalysisResponse
)
from app.services.telemetry import get_all_events, get_event_by_id, activate_event
from app.services.pond_agent import analyze_pond_health
from app.services.energy_agent import analyze_energy_system
from app.services.cold_chain_agent import analyze_cold_chain
from app.services.risk_agent import analyze_risk_profile
from app.services.orchestrator import generate_action_plan, build_coordinated_action_plan, analyze_operational_input
from app.services.ai_gateway import orchestrate_with_ai_gateway, get_ai_gateway_health
from app.services.safety import evaluate_safety_policies, evaluate_policy_engine
from app.services.control_layer import execute_control_action, get_audit_logs, run_execution_simulation
from app.services.impact import calculate_detailed_impact
from app.services.copilot import query_copilot
from app.services.context_engine import normalize_event_state
from app.services.tool_gateway import execute_tool_controlled, REGISTERED_TOOLS
from app.services.digital_twin import digital_twin
from app.governance.audit import audit_logger
from app.governance.approvals import approval_engine

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "AquaVolt Intelligence Layer", "version": "1.0.0"}

@router.get("/ai/health")
def ai_health_check():
    return get_ai_gateway_health()

@router.get("/events", response_model=List[IoTEvent])
def list_events():
    return get_all_events()

@router.get("/events/{event_id}", response_model=IoTEvent)
def get_event(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/events/{event_id}/activate", response_model=FarmState)
def trigger_activate_event(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    farm_state = activate_event(event_id)
    return farm_state

# Individual Specialist Agent Endpoints
@router.get("/agents/pond/{event_id}", response_model=PondAgentOutput)
def run_pond_agent(event_id: str):
    event = get_event_by_id(event_id)
    p = event.pond_state
    eq = event.equipment_state
    return analyze_pond_health(
        dissolved_oxygen=p.pond_do,
        do_trend=p.pond_do_trend,
        water_temperature=p.pond_water_temp,
        aerators_on=p.aerators_on,
        total_aerators=p.total_aerators,
        pumps_kw=eq.pumps_kw,
        aerator_soft_start_active=eq.aerator_soft_start_active
    )

@router.get("/agents/energy/{event_id}", response_model=EnergyAgentOutput)
def run_energy_agent(event_id: str):
    event = get_event_by_id(event_id)
    e = event.energy_state
    b = event.battery_state
    return analyze_energy_system(
        solar_generation=e.solar_kw,
        battery_soc=b.battery_soc,
        grid_availability=e.grid_available,
        load_demand=e.total_load_kw
    )

@router.get("/agents/cold-chain/{event_id}", response_model=ColdChainAgentOutput)
def run_cold_chain_agent(event_id: str):
    event = get_event_by_id(event_id)
    c = event.cold_chain_state
    e = event.energy_state
    return analyze_cold_chain(
        cold_room_temperature=c.cold_room_temp,
        target_temperature_min=c.cold_room_target_min,
        target_temperature_max=c.cold_room_target_max,
        thermal_buffer_hours=c.thermal_buffer_hours,
        solar_generation=e.solar_kw
    )

@router.get("/agents/risk/{event_id}", response_model=RiskAgentOutput)
def run_risk_agent(event_id: str):
    event = get_event_by_id(event_id)
    pond_out = run_pond_agent(event_id)
    energy_out = run_energy_agent(event_id)
    cold_out = run_cold_chain_agent(event_id)
    return analyze_risk_profile(
        pond_out, energy_out, cold_out,
        event_severity=event.severity,
        solar_drop_pct=event.energy_state.solar_drop_percent,
        grid_available=event.energy_state.grid_available,
        battery_soc=event.battery_state.battery_soc,
        do_trend=event.pond_state.pond_do_trend,
    )

@router.post("/orchestrator/coordinated-plan/{event_id}", response_model=CoordinatedActionPlan)
def get_coordinated_plan(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    farm_state = activate_event(event_id)
    pond_res = run_pond_agent(event_id)
    energy_res = run_energy_agent(event_id)
    cold_res = run_cold_chain_agent(event_id)
    risk_res = run_risk_agent(event_id)

    return orchestrate_with_ai_gateway(
        event=event,
        farm_state=farm_state,
        pond_res=pond_res,
        energy_res=energy_res,
        cold_res=cold_res,
        risk_res=risk_res
    )

@router.post("/safety/validate/{event_id}", response_model=SafetyEngineResult)
def validate_plan_safety(event_id: str):
    event = get_event_by_id(event_id)
    plan = get_coordinated_plan(event_id)
    farm_state = activate_event(event_id)
    return evaluate_safety_policies(plan, farm_state, event=event)

@router.post("/control/simulate/{event_id}", response_model=ExecutionSimulationResult)
def simulate_control_execution(event_id: str, action: str = "approve"):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    plan = generate_action_plan(event)
    req = ApprovalRequest(event_id=event_id, action=action)
    # Execution gate: high-severity plans cannot run without explicit operator action
    if plan.requires_human_approval and action not in ("approve", "modify", "reject"):
        raise HTTPException(
            status_code=403,
            detail=f"EXECUTION BLOCKED: This plan (risk level HIGH) requires explicit operator approval before execution. Received action='{action}'.")
    return run_execution_simulation(req, plan)

@router.get("/impact/detailed/{event_id}", response_model=DetailedImpactMetrics)
def get_detailed_impact(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    plan = generate_action_plan(event)
    return calculate_detailed_impact(plan)

@router.post("/analyze", response_model=UnifiedAnalysisResponse)
def analyze_endpoint(request: AnalyzeRequest):
    """
    Primary AquaVolt AI Operational Analysis API.
    Accepts operational input text or structured telemetry, executes specialist agents,
    orchestrates a unified action plan, validates deterministic safety policies, and
    returns the complete situation analysis, risk assessment, and recommended plan.
    """
    return analyze_operational_input(request)

@router.api_route("/plan/{event_id}", methods=["GET", "POST"], response_model=ActionPlan)
def create_plan(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return generate_action_plan(event)

@router.post("/approve")
def approve_plan(request: ApprovalRequest):
    event = get_event_by_id(request.event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    plan = generate_action_plan(event)

    # ── Execution Gate ────────────────────────────────────────────────────────
    # The Safety Engine and Approval Engine manage valid actions.
    # An action must be 'approve', 'modify', or 'reject'.
    # If rejected, execute_control_action records the rejection to the audit trail
    # and dispatches zero control actions to the digital twin.
    if request.action not in ("approve", "modify", "reject"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{request.action}'. Permitted actions: 'approve', 'modify', 'reject'."
        )

    result = execute_control_action(request, plan)
    return result

@router.get("/audit-logs", response_model=List[AuditLogEntry])
def fetch_audit_logs():
    return get_audit_logs()

@router.post("/copilot", response_model=CopilotResponse)
def ask_copilot(query: CopilotQuery):
    return query_copilot(query)

# ── Phase 7: Normalized Shared State ──────────────────────────────────────────
@router.get("/state/normalized/{event_id}", response_model=NormalizedAquaVoltState)
def get_normalized_state(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return normalize_event_state(event)

# ── Phase 12: Safety / Policy Engine Evaluation ──────────────────────────────
@router.post("/safety/policy-engine/{event_id}", response_model=PolicyEvaluationResponse)
def evaluate_policies_endpoint(event_id: str):
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    plan = get_coordinated_plan(event_id)
    farm_state = activate_event(event_id)
    return evaluate_policy_engine(plan, farm_state, event=event)

# ── Phase 14: Controlled Tool Gateway ─────────────────────────────────────────
@router.get("/tools")
def list_registered_tools():
    """Returns the catalog of all authorized tools that the Tool Gateway can execute."""
    return {
        "tools": REGISTERED_TOOLS,
        "gateway": "AquaVolt Controlled Tool Gateway (Inspired by AgentShield)",
        "disclaimer": "PoC Simulated Execution against PS04 Digital Twin"
    }

@router.post("/tools/execute", response_model=ToolExecutionResult)
def execute_tool_endpoint(request: ToolCallRequest):
    """Executes a registered equipment tool after parameter & policy validation."""
    # Lookup event context if provided
    do_val = 4.5
    temp_val = 4.0
    soc_val = 50.0
    if request.event_id:
        ev = get_event_by_id(request.event_id)
        if ev:
            do_val = ev.pond_state.pond_do
            temp_val = ev.cold_chain_state.cold_room_temp
            soc_val = ev.battery_state.battery_soc

    return execute_tool_controlled(
        request=request,
        current_pond_do=do_val,
        current_cold_temp=temp_val,
        current_battery_soc=soc_val
    )

# ── Phase 15: PS04 Digital Twin ──────────────────────────────────────────────
@router.get("/digital-twin/state")
def get_digital_twin_state():
    """Returns the live snapshot of the simulated PS04 Digital Twin."""
    return digital_twin.get_full_state()

# ── Phase 18: Governance Audit Trail (AgentShield style) ─────────────────────
@router.get("/governance/audit-trail")
def get_governance_audit_trail(limit: int = 50, component: Optional[str] = None):
    """Returns comprehensive multi-stage audit logs from IoT Event through Twin Execution."""
    return audit_logger.get_recent(limit=limit, component=component)

# ── Phase 13: Human-in-the-Loop Approvals ─────────────────────────────────────
@router.get("/governance/approvals")
def get_approval_requests():
    """Returns approval requests and decisions recorded in the governance workflow."""
    return list(approval_engine._requests.values())

