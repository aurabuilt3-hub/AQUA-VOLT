import datetime
import uuid
from typing import List, Dict, Any
from app.models.schemas import (
    ActionPlan, AuditLogEntry, ApprovalRequest,
    ControlActionLog, TimelineStep, ExecutionSimulationResult,
    ImpactMetrics
)
from app.services.impact import calculate_plan_impact

# ─────────────────────────────────────────────────────────────────────────────
# PoC Digital Control Layer — Execution Simulator
#
# IMPORTANT: This module is a SIMULATED HARDWARE CONTROL layer for the
# AquaVolt hackathon PoC. It does NOT communicate with or control any
# physical equipment, relays, VFDs, or electrical systems.
#
# PoC Digital Control Layer & Digital Twin Simulated Control
# In future stages, each simulate_* call maps to
# an ESP32 MQTT command, VFD frequency ramp signal, or relay actuator API.
# ─────────────────────────────────────────────────────────────────────────────

AUDIT_LOGS: List[AuditLogEntry] = []

def run_execution_simulation(request: ApprovalRequest, plan: ActionPlan) -> ExecutionSimulationResult:
    now = datetime.datetime.now()
    now_str = now.strftime("%H:%M:%S")
    date_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # If the operator rejects the plan, zero realized impact is produced.
    if request.action == "reject":
        impact = ImpactMetrics(
            energy_optimized_kwh=0.0,
            cost_avoided_inr=0.0,
            diesel_avoided_liters=0.0,
            co2_avoided_kg=0.0,
            product_protected_tons=0.0,
            critical_ops_safety_pct=0.0,
            aerator_inrush_suppressed_kw=0.0,
            thermal_energy_stored_kwh=0.0,
            timestamp=now_str
        )
    else:
        impact = calculate_plan_impact(plan)

    control_actions: List[ControlActionLog] = []
    timeline: List[TimelineStep] = []

    # 1. Execution Timeline (PoC simulated sequence)
    t0 = (now - datetime.timedelta(seconds=8)).strftime("%H:%M:%S")
    t1 = (now - datetime.timedelta(seconds=7)).strftime("%H:%M:%S")
    t2 = (now - datetime.timedelta(seconds=6)).strftime("%H:%M:%S")
    t3 = (now - datetime.timedelta(seconds=5)).strftime("%H:%M:%S")
    t4 = (now - datetime.timedelta(seconds=4)).strftime("%H:%M:%S")
    t5 = (now - datetime.timedelta(seconds=3)).strftime("%H:%M:%S")
    t6 = (now - datetime.timedelta(seconds=2)).strftime("%H:%M:%S")
    t7 = now_str

    if request.action == "reject":
        timeline = [
            TimelineStep(step_number=1, timestamp=t0, title="IoT Telemetry Ingested", detail=f"Received signal for '{plan.event_title}'.", status="completed"),
            TimelineStep(step_number=2, timestamp=t1, title="Agents Domain Analysis", detail="4 Specialist Agents (Pond, Energy, Cold Chain, Risk) evaluated thresholds.", status="completed"),
            TimelineStep(step_number=3, timestamp=t2, title="Action Plan Orchestrated", detail="Load prioritization and energy supply strategy generated.", status="completed"),
            TimelineStep(step_number=4, timestamp=t3, title="Safety Validation Passed", detail="9 Deterministic Safety Policy Rules verified and repaired where needed.", status="completed"),
            TimelineStep(step_number=5, timestamp=t4, title="Operator Rejected Plan", detail="Operator rejected execution. No equipment commands dispatched.", status="completed"),
            TimelineStep(step_number=6, timestamp=t7, title="Execution Aborted", detail="PoC: System remains in current operating state. Zero commands sent.", status="completed")
        ]
    else:
        timeline = [
            TimelineStep(step_number=1, timestamp=t0, title="IoT Telemetry Ingested", detail=f"Received signal for '{plan.event_title}'.", status="completed"),
            TimelineStep(step_number=2, timestamp=t1, title="Agents Domain Analysis", detail="4 Specialist Agents (Pond, Energy, Cold Chain, Risk) evaluated thresholds.", status="completed"),
            TimelineStep(step_number=3, timestamp=t2, title="Action Plan Orchestrated", detail="Load prioritization and energy supply strategy generated.", status="completed"),
            TimelineStep(step_number=4, timestamp=t3, title="Safety Validation Passed", detail="9 Deterministic Safety Policy Rules verified and repaired where needed.", status="completed"),
            TimelineStep(step_number=5, timestamp=t4, title="Human Operator Approved", detail=f"Operator executed action: '{request.action.upper()}'.", status="completed"),
            TimelineStep(step_number=6, timestamp=t5, title="[SIM] Aerator Soft-Start Commanded", detail="PoC: VFD soft-start sequence simulated (0 → 50 Hz ramp over 120s; 30s staggered motor starts).", status="completed"),
            TimelineStep(step_number=7, timestamp=t6, title="[SIM] Cooling Strategy Applied", detail=f"PoC: Simulated thermal pre-cooling command issued. Target: {plan.thermal_precool_rig.cold_storage_precooled_temp_c}°C.", status="completed"),
            TimelineStep(step_number=8, timestamp=t7, title="[SIM] Flexible Loads Deferred", detail="PoC: Simulated load deferral commands issued to ice plant and processing unit contactor models.", status="completed")
        ]

    # 2. Simulated Control Action Dispatches
    #    Each entry below represents a command that would be sent to a real
    #    ESP32 / MQTT broker / VFD controller in a hardware-integrated deployment.
    if request.action in ["approve", "modify"]:
        control_actions.append(ControlActionLog(
            action="aerator_soft_start",
            target_equipment="[SIM] Aerator VFD Soft-Start Controller (Pond #1 & #2)",
            previous_state="Direct-on-Line Mode (18.5 kW Inrush Surge Risk)",
            new_state="Simulated VFD Frequency Ramp Active (6.4 kW Peak Clamped)",
            timestamp=t5,
            success=True,
            message="[PoC] Simulated VFD Soft-Start Sequence initiated. Inrush surge clamped in digital model."
        ))

        control_actions.append(ControlActionLog(
            action="thermal_precooling_control",
            target_equipment="[SIM] Cold Storage Compressor Controller",
            previous_state="Standard 4.0°C Refrigeration Cycle",
            new_state="Simulated Thermal Pre-Cooling Active (Target 1.5°C)",
            timestamp=t6,
            success=True,
            message=f"[PoC] Simulated Thermal Pre-Cooling Control issued. Estimated {plan.thermal_precool_rig.thermal_energy_stored_kwh:.1f} kWh thermal buffer modelled."
        ))

        control_actions.append(ControlActionLog(
            action="flexible_load_deferral",
            target_equipment="[SIM] Ice Plant & Processing Unit Load Controller",
            previous_state="Active (7.0 kW combined load)",
            new_state="Simulated Deferral Active (0.0 kW shed)",
            timestamp=t7,
            success=True,
            message="[PoC] Simulated load deferral command issued. Battery 20% reserve floor protected in digital model."
        ))

        control_actions.append(ControlActionLog(
            action="battery_reserve_lock",
            target_equipment="[SIM] Battery Management System (BMS) Controller",
            previous_state="Standard Discharge Mode",
            new_state="Simulated Emergency Reserve Floor (20% SOC locked)",
            timestamp=t7,
            success=True,
            message="[PoC] Simulated BMS floor reserve command issued per Safety Engine Policy 3."
        ))

        # Update PS04 Digital Twin state
        from app.services.digital_twin import digital_twin
        digital_twin.simulate_start_aerator_soft_start(
            ramp_seconds=plan.soft_start_rig.ramp_duration_sec,
            stagger_seconds=plan.soft_start_rig.stagger_interval_sec
        )
        if plan.thermal_precool_rig.enabled:
            digital_twin.simulate_start_precooling(target_temp_c=plan.thermal_precool_rig.cold_storage_precooled_temp_c)
        digital_twin.simulate_pause_ice_production(45)
        digital_twin.simulate_pause_processing(60)
        digital_twin.simulate_maintain_battery_reserve(20.0)

    else:
        control_actions.append(ControlActionLog(
            action="plan_rejection_fallback",
            target_equipment="[SIM] PoC Control Gateway",
            previous_state="Proposed AquaVolt Load Allocation",
            new_state="No Change — Existing State Preserved (Manual Mode)",
            timestamp=now_str,
            success=False,
            message="[PoC] Plan rejected by operator. No simulated commands dispatched. System state unchanged."
        ))

    # Update Approval Engine state
    from app.governance.approvals import approval_engine
    from app.governance.audit import audit_logger
    approval_engine.process_decision(
        event_id=plan.event_id,
        action=request.action,
        reviewer="Demo Operator",
        notes=request.notes
    )

    if request.action == "reject":
        summary_message = "Execution cancelled (rejected) — no equipment commands dispatched."
        human_decision = "REJECTED by Demo Operator"
        execution_result = "Execution cancelled (rejected) — no equipment commands dispatched."
        action_taken_str = "REJECTED"
    else:
        summary_message = (
            f"[PoC SIMULATION] '{request.action.upper()}' processed for '{plan.event_title}'. "
            f"{len(control_actions)} simulated control commands modelled in the PoC Digital Control Layer. "
            "Critical loads protected in the Digital Twin. No physical equipment was controlled."
        )
        human_decision = f"{request.action.upper()} by Demo Operator"
        execution_result = (
            f"[PoC Simulated] {len(control_actions)} simulated control commands dispatched to PoC Digital Control Layer. "
            "Digital Twin Execution — simulated control against PS04 model."
        )
        action_taken_str = request.action.upper()

    detected_risk = f"Risk Score {plan.risk_score}/100 — {'HIGH RISK — Mandatory Approval' if plan.requires_human_approval else 'AUTO-SAFE'}"
    agent_analysis = "Pond aerator soft-start protected; Cold room safe; Energy supply optimized."
    recommended_action = "Protect aeration + cold storage; Defer ice plant & processing loads."
    safety_result = "Passed (9 Safety Policies Verified)"

    log_entry = AuditLogEntry(
        id=str(uuid.uuid4())[:8],
        timestamp=date_str,
        event_id=plan.event_id,
        event_title=plan.event_title,
        detected_risk=detected_risk,
        agent_analysis=agent_analysis,
        recommended_action=recommended_action,
        safety_result=safety_result,
        human_decision=human_decision,
        execution_result=execution_result,
        action_taken=action_taken_str,
        executed_by="Demo Operator",
        summary=summary_message,
        impact=impact
    )

    AUDIT_LOGS.insert(0, log_entry)

    # Log to Governance Audit Logger
    audit_logger.log(
        component="Human_Approval",
        event_type="APPROVAL_DECISION",
        event_id=plan.event_id,
        title=f"Operator Decision: {action_taken_str}",
        summary=summary_message,
        status="APPROVED" if request.action in ("approve", "modify") else "REJECTED",
        metadata={"action": request.action, "risk_score": plan.risk_score}
    )

    if request.action in ("approve", "modify"):
        audit_logger.log(
            component="Tool_Gateway",
            event_type="TOOLS_EXECUTED",
            event_id=plan.event_id,
            title="Tool Gateway Dispatched Simulated Commands",
            summary=f"Dispatched {len(control_actions)} safe commands to PS04 Digital Twin execution environment.",
            status="SUCCESS",
            metadata={"actions_count": len(control_actions)}
        )
        audit_logger.log(
            component="Digital_Twin",
            event_type="DIGITAL_TWIN_UPDATED",
            event_id=plan.event_id,
            title="PS04 Digital Twin State Updated",
            summary=f"Aerators: VFD Soft-Start (12.1 kW inrush suppressed) | Cold Storage: {plan.thermal_precool_rig.status} | Flexible Loads: Deferred",
            status="SUCCESS",
            metadata={"aerators_mode": "VFD_SOFT_START", "inrush_clamped_kw": 12.1}
        )
        audit_logger.log(
            component="Impact_Engine",
            event_type="IMPACT_RECORDED",
            event_id=plan.event_id,
            title="Modeled PoC Impact Calculated",
            summary=f"Modeled {impact.energy_optimized_kwh:.1f} kWh energy optimized, ₹{impact.cost_avoided_inr:.2f} cost avoided, {impact.diesel_avoided_liters:.1f}L diesel saved.",
            status="SUCCESS",
            metadata=impact.model_dump()
        )
    else:
        audit_logger.log(
            component="Tool_Gateway",
            event_type="TOOLS_ABORTED",
            event_id=plan.event_id,
            title="Tool Gateway Aborted Execution",
            summary="Plan rejected by operator. Zero control actions dispatched to Digital Twin.",
            status="REJECTED",
            metadata={"actions_count": 0}
        )
        audit_logger.log(
            component="Impact_Engine",
            event_type="IMPACT_RECORDED",
            event_id=plan.event_id,
            title="Execution Cancelled — Zero Impact Realized",
            summary="Operator rejected plan. No control actions dispatched, zero cost/energy impact realized.",
            status="REJECTED",
            metadata=impact.model_dump()
        )

    return ExecutionSimulationResult(
        event_id=plan.event_id,
        action_taken=request.action,
        is_simulation=True,
        executed_at=date_str,
        control_actions=control_actions,
        timeline=timeline,
        summary_message=summary_message,
        impact=impact,
        audit_entry=log_entry
    )

def execute_control_action(request: ApprovalRequest, plan: ActionPlan) -> Dict[str, Any]:
    sim_res = run_execution_simulation(request, plan)
    return {
        "status": sim_res.action_taken,
        "message": sim_res.summary_message,
        "audit_entry": sim_res.audit_entry,
        "impact": sim_res.impact,
        "simulation": sim_res
    }

def get_audit_logs() -> List[AuditLogEntry]:
    return AUDIT_LOGS
