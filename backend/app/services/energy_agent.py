from typing import List, Dict
from app.models.schemas import EnergyAgentOutput, AgentAnalysis

def analyze_energy_system(
    solar_generation: float,
    battery_soc: float,
    battery_reserve: float = 20.0,
    current_load: float = 11.2,
    grid_availability: bool = True,
    load_demand: float = 18.0
) -> EnergyAgentOutput:
    warnings: List[str] = []

    # Handle cases where callers pass grid_availability as 3rd positional arg
    if isinstance(battery_reserve, bool):
        grid_availability = battery_reserve
        battery_reserve = 20.0
    if isinstance(current_load, (int, float)) and current_load > 12.0:
        load_demand = current_load

    # Available energy calculation
    battery_capacity_kw = 8.0 if battery_soc > battery_reserve else 0.0
    grid_capacity_kw = 15.0 if grid_availability else 0.0
    total_available_kw = round(solar_generation + battery_capacity_kw + grid_capacity_kw, 1)

    net_balance = round(solar_generation - load_demand, 1)
    energy_deficit = max(0.0, round(load_demand - (solar_generation + (battery_capacity_kw if not grid_availability else 15.0)), 1))

    if battery_soc < battery_reserve:
        energy_status = "critical"
        battery_action = f"CRITICAL FLOOR: Battery at {battery_soc:.0f}% (Floor: {battery_reserve:.0f}%). Mandatory load shedding engaged."
        warnings.append(f"CRITICAL: Battery SOC ({battery_soc:.0f}%) is below strict emergency floor ({battery_reserve:.0f}%).")
    elif net_balance <= -5.0 and not grid_availability:
        energy_status = "warning"
        battery_action = "Discharging to assist critical pond aerators and cold storage."
        warnings.append("Grid outage during low solar output. Heavy battery discharge rate.")
    elif solar_generation > 14.0:
        energy_status = "ok"
        battery_action = "Solar surplus charging battery and driving Thermal Pre-Cooling."
    else:
        energy_status = "ok"
        battery_action = "Battery reserve maintained in healthy standby zone."

    if grid_availability:
        grid_action = "Grid connected; on standby for peak demand protection."
    else:
        grid_action = "Grid Unavailable — Microgrid operating in standalone island mode."
        warnings.append("Grid power offline. Running on microgrid island mode.")

    key_metrics = {
        "Solar Output": f"{solar_generation:.1f} kW",
        "Battery SOC": f"{battery_soc:.0f}%",
        "Grid Status": "Connected ●" if grid_availability else "Outage ✖",
        "Net Balance": f"{net_balance:+.1f} kW",
        "Available Capacity": f"{total_available_kw:.1f} kW"
    }

    recs = [battery_action, grid_action]
    if energy_deficit > 0:
        recs.append(f"Shed flexible loads to eliminate {energy_deficit:.1f} kW deficit")

    b_risk = "critical" if battery_soc < battery_reserve else ("warning" if battery_soc < 40.0 else "low")

    return EnergyAgentOutput(
        energy_status=energy_status,
        available_energy=total_available_kw,
        energy_deficit=energy_deficit,
        battery_action=battery_action,
        grid_action=grid_action,
        warnings=warnings,
        key_metrics=key_metrics,
        battery_risk=b_risk,
        recommendations=recs
    )

def energy_output_to_agent_analysis(out: EnergyAgentOutput) -> AgentAnalysis:
    findings = [out.battery_action, out.grid_action] + out.warnings
    return AgentAnalysis(
        agent_id="energy",
        agent_name="Energy & Microgrid Specialist",
        icon="⚡",
        status=out.energy_status,
        findings=findings,
        key_metrics=out.key_metrics
    )
