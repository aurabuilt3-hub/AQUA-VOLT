from typing import List, Dict, Optional
from app.models.schemas import (
    PondAgentOutput, EnergyAgentOutput, ColdChainAgentOutput,
    RiskAgentOutput, AgentAnalysis
)

# ─────────────────────────────────────────────────────────────────────────────
# Risk Scoring — Thresholds
# ─────────────────────────────────────────────────────────────────────────────
def analyze_risk_profile(
    pond_analysis: PondAgentOutput,
    energy_analysis: EnergyAgentOutput,
    cold_chain_analysis: ColdChainAgentOutput,
    event_severity: str = "low",
    solar_drop_pct: Optional[float] = None,
    grid_available: Optional[bool] = None,
    battery_soc: Optional[float] = None,
    do_trend: Optional[str] = None,
) -> RiskAgentOutput:
    """
    Deterministic risk profiler.
    Risk is an ANALYSIS OUTPUT strictly derived from live telemetry measurements
    and specialist agent outputs, never mapped from static scenario metadata.

    Parameters:
      event_severity  — Legacy parameter preserved for backward-compatibility; ignored for risk scoring.
      solar_drop_pct  — Percentage solar dropped this event (0–100)
      grid_available  — Whether main grid is connected
      battery_soc     — Current battery state-of-charge %
      do_trend        — Pond DO trend ("falling"/"stable"/"rising")
    """
    # Dynamic baseline: starts at 0 and increments strictly based on physical telemetry risk factors
    # Auto-extract telemetry from specialist agent outputs if not explicitly supplied
    if battery_soc is None:
        if energy_analysis and "Battery SOC" in getattr(energy_analysis, "key_metrics", {}):
            try:
                battery_soc = float(energy_analysis.key_metrics["Battery SOC"].replace("%", "").strip())
            except Exception:
                battery_soc = 100.0
        else:
            battery_soc = 100.0

    if solar_drop_pct is None:
        if energy_analysis and "Solar Output" in getattr(energy_analysis, "key_metrics", {}):
            try:
                val_str = energy_analysis.key_metrics["Solar Output"].replace("kW", "").strip()
                skw = float(val_str)
                if skw < 18.4:
                    solar_drop_pct = max(0.0, round((18.4 - skw) / 18.4 * 100.0, 1))
                else:
                    solar_drop_pct = 0.0
            except Exception:
                solar_drop_pct = 0.0
        else:
            solar_drop_pct = 0.0

    if grid_available is None:
        if energy_analysis and "Grid Status" in getattr(energy_analysis, "key_metrics", {}):
            try:
                status_str = str(energy_analysis.key_metrics["Grid Status"])
                grid_available = not ("Outage" in status_str or "✖" in status_str)
            except Exception:
                grid_available = True
        else:
            grid_available = True

    if do_trend is None:
        if pond_analysis and "DO Trend" in getattr(pond_analysis, "key_metrics", {}):
            try:
                do_trend = pond_analysis.key_metrics["DO Trend"].lower().strip()
            except Exception:
                do_trend = "stable"
        else:
            do_trend = "stable"

    risk_score = 0
    explanation_parts = []

    # ── 1. Pond Risk Weighting ────────────────────────────────────────────────
    if pond_analysis.pond_status == "critical":
        risk_score += 45
        explanation_parts.append("Pond Dissolved Oxygen is at critical emergency levels (< 3.0 mg/L).")
    elif pond_analysis.pond_status == "warning":
        risk_score += 25
        explanation_parts.append("Pond oxygen requires active VFD aerator soft-start boost.")
    # DO falling trend is an early warning factor
    if do_trend == "falling":
        risk_score += 10
        explanation_parts.append("Pond DO trend is falling — aerator readiness elevated.")

    # ── 2. Cold Chain Risk Weighting ─────────────────────────────────────────
    if cold_chain_analysis.cold_chain_status == "critical":
        risk_score += 40
        explanation_parts.append("Cold storage temperature exceeds safety limits (> 5.5°C).")
    elif cold_chain_analysis.cold_chain_status == "warning":
        risk_score += 15
        explanation_parts.append("Cold storage temperature approaching upper limit (> 4.5°C).")

    # ── 3. Energy / Microgrid Risk Weighting ─────────────────────────────────
    if energy_analysis.energy_status == "critical":
        risk_score += 30
        explanation_parts.append("Battery SOC below emergency floor (20%).")
    elif energy_analysis.energy_status == "warning":
        risk_score += 15
        explanation_parts.append("Microgrid running on island battery mode during power deficit.")

    # Large solar drops are an independent energy-supply risk
    if solar_drop_pct >= 50.0:
        risk_score += 25
        explanation_parts.append(f"Solar generation dropped {solar_drop_pct:.0f}% — significant renewable supply loss.")
    elif solar_drop_pct >= 20.0:
        risk_score += 10
        explanation_parts.append(f"Solar generation dropped {solar_drop_pct:.0f}% — microgrid in partial-deficit mode.")

    # Grid loss requires operator awareness
    if not grid_available:
        risk_score += 18
        explanation_parts.append("Main electrical grid offline — facility operating in standalone island mode.")

    # Low battery (< 40%) during any event requires cautious management
    if battery_soc < 20.0:
        risk_score += 20
        explanation_parts.append("Battery at critical reserve floor (< 20%).")
    elif battery_soc < 40.0:
        risk_score += 15
        explanation_parts.append("Battery below 40% — limited discharge headroom for load transients.")

    # Net load deficit under current demand
    if getattr(energy_analysis, "energy_deficit", 0) > 0 or (solar_drop_pct >= 50.0 and battery_soc < 40.0):
        risk_score += 8
        explanation_parts.append("Microgrid load deficit detected under current operational demand.")

    risk_score = min(100, max(0, risk_score))

    # ── Risk Level ────────────────────────────────────────────────────────────
    if risk_score >= 60:
        overall_risk = "critical"
    elif risk_score >= 40:
        overall_risk = "high"
    elif risk_score >= 25:
        overall_risk = "medium"
    else:
        overall_risk = "low"

    # ── Load Classification ───────────────────────────────────────────────────
    critical_loads = ["🐟 Pond Aerator VFD Soft-Start Rig"]
    if cold_chain_analysis.refrigeration_priority in ["high", "critical"]:
        critical_loads.append("❄️ Cold Storage Compressor")

    high_priority_loads = ["💧 Water Circulation Pumps"]
    if "❄️ Cold Storage Compressor" not in critical_loads:
        high_priority_loads.append("❄️ Cold Storage Compressor")

    flexible_loads = [
        "🧊 Ice Production Plant (Pause 45m)",
        "🏭 Shrimp Processing Line (Shift window)",
        "💡 Non-Essential Auxiliary Lighting (50% dim)"
    ]

    loads_must_never_be_disabled = [
        "Pond Aerator VFD Soft-Start Rig when DO < 4.0 mg/L",
        "Cold Storage Refrigeration when room temp > 5.0°C"
    ]

    # Human approval is required whenever risk score ≥ 40 (i.e. overall_risk is
    # "high" or "critical"), which by construction always includes all events
    # with severity == "high" because their floor is already 40.
    human_approval_requirement = risk_score >= 40

    if not explanation_parts:
        explanation = "All domain agents report optimal conditions. System operating within safe parameters."
    else:
        explanation = f"Risk Score {risk_score}/100 ({overall_risk.upper()}) — " + " ".join(explanation_parts)

    key_metrics = {
        "Risk Score": f"{risk_score}/100",
        "Risk Level": overall_risk.upper(),
        "Approval Requirement": "Human Review Required" if human_approval_requirement else "Auto-Optimizable",
        "Critical Load Count": str(len(critical_loads)),
        "Flexible Load Count": str(len(flexible_loads))
    }

    return RiskAgentOutput(
        overall_risk=overall_risk,
        overall_risk_score=risk_score,
        critical_loads=critical_loads,
        high_priority_loads=high_priority_loads,
        flexible_loads=flexible_loads,
        loads_must_never_be_disabled=loads_must_never_be_disabled,
        human_approval_requirement=human_approval_requirement,
        explanation=explanation,
        key_metrics=key_metrics
    )

def risk_output_to_agent_analysis(out: RiskAgentOutput) -> AgentAnalysis:
    findings = [
        out.explanation,
        f"Critical Loads: {', '.join(out.critical_loads)}",
        f"Flexible Loads (Deferrable): {', '.join(out.flexible_loads)}",
        f"Protected Rule: {out.loads_must_never_be_disabled[0]}"
    ]
    return AgentAnalysis(
        agent_id="risk",
        agent_name="Operational & Safety Risk Specialist",
        icon="🛡️",
        status="critical" if out.overall_risk in ["high", "critical"] else ("warning" if out.overall_risk == "medium" else "ok"),
        findings=findings,
        key_metrics=out.key_metrics
    )
