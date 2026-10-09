from typing import List, Dict
from app.models.schemas import ColdChainAgentOutput, AgentAnalysis

def analyze_cold_chain(
    cold_room_temperature: float,
    target_temperature_min: float = 2.0,
    target_temperature_max: float = 5.0,
    product_quantity_tons: float = 2.8,
    refrigeration_state: str = "ACTIVE",
    cooling_demand_kw: float = 3.2,
    thermal_buffer_hours: float = 2.5,
    solar_generation: float = 12.0
) -> ColdChainAgentOutput:
    warnings: List[str] = []

    if cold_room_temperature > 5.5:
        cold_chain_status = "critical"
        refrigeration_priority = "critical"
        temperature_risk = "high"
        pre_cooling_recommendation = "Emergency cooling boost required! Temperature exceeds 5.5°C threshold."
        explanation = f"CRITICAL: Cold storage at {cold_room_temperature:.1f}°C risks bacterial spoilage of harvest product ({product_quantity_tons} tons)."
        warnings.append(f"Temperature high ({cold_room_temperature:.1f}°C). Product degradation risk!")
    elif cold_room_temperature > 4.5:
        cold_chain_status = "warning"
        refrigeration_priority = "high"
        temperature_risk = "moderate"
        pre_cooling_recommendation = "Maintain refrigeration compressor; temperature approaching upper safety limit."
        explanation = f"Cold storage temperature elevated at {cold_room_temperature:.1f}°C."
        warnings.append(f"Cold room at {cold_room_temperature:.1f}°C approaching 5.0°C upper limit.")
    else:
        cold_chain_status = "ok"
        refrigeration_priority = "medium"
        temperature_risk = "low"
        explanation = f"Cold storage temperature stable at {cold_room_temperature:.1f}°C (Range: {target_temperature_min:.1f} – {target_temperature_max:.1f}°C)."

        if solar_generation > 14.0:
            pre_cooling_recommendation = "Engage Thermal Pre-Cooling to 1.5°C using excess midday solar generation."
        elif thermal_buffer_hours > 2.0:
            pre_cooling_recommendation = f"Thermal energy buffer active. {thermal_buffer_hours:.1f} hours safe compressor off-time."
        else:
            pre_cooling_recommendation = "Standard refrigeration cycle active."

    key_metrics = {
        "Cold Room Temp": f"{cold_room_temperature:.1f} °C",
        "Target Range": f"{target_temperature_min:.1f} – {target_temperature_max:.1f} °C",
        "Product Stock": f"{product_quantity_tons:.1f} Tons",
        "Thermal Hold Buffer": f"{thermal_buffer_hours:.1f} Hours",
        "Refrigeration Priority": refrigeration_priority.upper(),
        "Temp Risk": temperature_risk.upper()
    }

    recs = [pre_cooling_recommendation]
    if refrigeration_priority in ["high", "critical"]:
        recs.append("Lock cold storage compressor ON; prevent temperature breach")

    return ColdChainAgentOutput(
        cold_chain_status=cold_chain_status,
        refrigeration_priority=refrigeration_priority,
        pre_cooling_recommendation=pre_cooling_recommendation,
        temperature_risk=temperature_risk,
        explanation=explanation,
        warnings=warnings,
        key_metrics=key_metrics,
        cooling_risk=cold_chain_status,
        thermal_buffer=f"{thermal_buffer_hours:.1f} Hours",
        recommendations=recs
    )

def cold_chain_output_to_agent_analysis(out: ColdChainAgentOutput) -> AgentAnalysis:
    findings = [out.explanation, out.pre_cooling_recommendation] + out.warnings
    return AgentAnalysis(
        agent_id="cold_chain",
        agent_name="Cold Storage & Thermal Pre-Cooling Specialist",
        icon="❄️",
        status=out.cold_chain_status,
        findings=findings,
        key_metrics=out.key_metrics
    )
