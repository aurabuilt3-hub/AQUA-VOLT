from typing import List, Dict, Optional
from app.models.schemas import PondAgentOutput, AgentAnalysis, IoTTelemetry, PondState, EquipmentState

def analyze_pond_health(
    dissolved_oxygen: float,
    do_trend: str = "stable",
    water_temperature: float = 28.0,
    ph: float = 7.8,
    salinity: float = 15.0,
    aerators_on: int = 4,
    total_aerators: int = 4,
    pumps_kw: float = 2.1,
    aerator_soft_start_active: bool = True
) -> PondAgentOutput:
    warnings: List[str] = []

    if dissolved_oxygen < 3.0:
        pond_status = "critical"
        aeration_criticality = "emergency"
        recommended_aeration = f"EMERGENCY: Engage all {total_aerators} aerator motors via Soft-Start Rig immediately!"
        warnings.append(f"CRITICAL: Dissolved Oxygen dropped to {dissolved_oxygen:.1f} mg/L (Min safe: 4.0 mg/L). Risk of shrimp mortality within 30 minutes!")
        explanation = "Emergency dissolved oxygen deficit detected. Maximum VFD frequency ramping dispatched."
    elif dissolved_oxygen < 4.0:
        pond_status = "warning"
        aeration_criticality = "high"
        recommended_aeration = "Ramp aerator frequency and stagger motor starts using Soft-Start Rig."
        warnings.append(f"WARNING: Dissolved Oxygen is {dissolved_oxygen:.1f} mg/L (trend: {do_trend}). Boost required.")
        explanation = "Dissolved oxygen is approaching critical thresholds. Aeration boost activated."
    elif dissolved_oxygen < 4.8 and do_trend == "falling":
        pond_status = "warning"
        aeration_criticality = "medium"
        recommended_aeration = "Maintain active aerators; prepare soft-start ramp if DO drops below 4.0 mg/L."
        warnings.append("DO level is declining. Monitoring trend closely.")
        explanation = "DO trend is falling despite adequate current aeration."
    else:
        pond_status = "ok"
        aeration_criticality = "low"
        recommended_aeration = f"Maintain normal operation ({aerators_on}/{total_aerators} aerators active)."
        explanation = f"Pond oxygen levels are healthy ({dissolved_oxygen:.1f} mg/L)."

    if water_temperature > 29.5:
        warnings.append(f"High water temp ({water_temperature:.1f}°C) reduces oxygen saturation capacity.")

    key_metrics = {
        "Dissolved Oxygen": f"{dissolved_oxygen:.1f} mg/L",
        "DO Trend": do_trend.upper(),
        "Water Temp": f"{water_temperature:.1f} °C",
        "pH / Salinity": f"{ph:.1f} / {salinity:.0f} ppt",
        "Aerators Active": f"{aerators_on}/{total_aerators}",
        "Soft Start Rig": "Active (VFD Clamped)" if aerator_soft_start_active else "Direct-on-Line"
    }

    observations = [
        f"Dissolved oxygen: {dissolved_oxygen:.1f} mg/L (trend: {do_trend})",
        f"Pond water temp: {water_temperature:.1f} °C",
        f"Aerators active: {aerators_on}/{total_aerators}",
        f"Soft-start rig: {'Active (VFD)' if aerator_soft_start_active else 'DOL'}"
    ]

    rec_actions = [recommended_aeration]
    if aerator_soft_start_active:
        rec_actions.append("Ensure 120s VFD frequency ramp to avoid breaker trips")

    return PondAgentOutput(
        pond_status=pond_status,
        aeration_criticality=aeration_criticality,
        recommended_aeration=recommended_aeration,
        warnings=warnings,
        explanation=explanation,
        key_metrics=key_metrics,
        risk=pond_status,
        observations=observations,
        recommended_actions=rec_actions,
        confidence=0.98 if dissolved_oxygen >= 4.0 else 0.95,
        reasoning_summary=explanation
    )

def pond_output_to_agent_analysis(out: PondAgentOutput) -> AgentAnalysis:
    findings = [out.explanation] + out.warnings
    return AgentAnalysis(
        agent_id="pond",
        agent_name="Pond Health & Aerator Specialist",
        icon="🐟",
        status=out.pond_status,
        findings=findings,
        key_metrics=out.key_metrics
    )
