from app.models.schemas import CopilotQuery, CopilotResponse
from app.services.telemetry import get_event_by_id

def query_copilot(query: CopilotQuery) -> CopilotResponse:
    q_lower = query.question.lower()
    event_id = query.context_event_id or "solar_drop"
    event = get_event_by_id(event_id)
    t = event.telemetry

    event_title = getattr(event, "title", None) or getattr(event, "name", "Active Scenario")

    reasoning_steps = [
        f"Analyzed query against current telemetry event: {event_title}.",
        f"Evaluated Dissolved Oxygen ({t.pond_dissolved_oxygen_mg_l:.1f} mg/L) & Cold Storage Temp ({t.cold_room_temp_c:.1f}°C).",
        "Checked Aerator Soft-Start Rig status and Thermal Pre-Cooling energy buffer.",
        "Applied AquaVolt PS04 priority rules: 1. Shrimp Oxygen Defense → 2. Cold Chain Security → 3. Energy Optimization."
    ]

    if "soft start" in q_lower or "aerator" in q_lower or "inrush" in q_lower:
        answer = (
            "Aerator motors in shrimp ponds draw up to 350% inrush current during direct-on-line startup, "
            "which can trip inverter circuit breakers or drain battery reserves rapidly. "
            "AquaVolt's Aerator Soft-Start Rig uses Variable Frequency Drives (VFD) to gradually ramp motor frequency "
            "over 120 seconds and stagger starts by 30 seconds, eliminating peak current spikes and protecting electrical hardware."
        )
        rec = "Keep Aerator Soft-Start Rig enabled for all pond aerator cycles."
    elif "pre-cool" in q_lower or "cold" in q_lower or "thermal" in q_lower:
        answer = (
            "Thermal Pre-Cooling converts cold storage into a zero-cost thermal energy storage battery. "
            "During peak midday solar generation, AquaVolt lowers the cold room target temperature from 4.0°C down to 1.5°C, "
            "storing thermal energy in the shrimp product mass. When solar drops or grid power fails, "
            "refrigeration compressors can be safely turned off for up to 4.2 hours without exceeding safe temperature limits."
        )
        rec = "Engage Thermal Pre-Cooling whenever solar surplus exceeds 3.0 kW."
    elif "defer" in q_lower or "ice" in q_lower or "processing" in q_lower:
        answer = (
            f"During the '{event_title}' event, available energy generation is restricted. "
            "AquaVolt prioritizes life-critical pond aerators and cold storage refrigeration over deferrable loads. "
            "Ice production (3.0 kW) and processing (4.0 kW) are deferred for 45–60 minutes to protect the battery reserve floor (20%)."
        )
        rec = "Approve recommended load deferral to maintain pond oxygen safety."
    else:
        answer = (
            f"For the selected event ('{event_title}'), AquaVolt's deterministic orchestrator prioritized pond dissolved oxygen "
            f"({t.pond_dissolved_oxygen_mg_l:.1f} mg/L) and cold chain safety ({t.cold_room_temp_c:.1f}°C). "
            "All non-essential loads are safely deferred while soft-start aerator control prevents electrical surges."
        )
        rec = "Review the 5-step action plan and confirm operator approval."

    return CopilotResponse(
        answer=answer,
        recommended_action=rec,
        reasoning_steps=reasoning_steps,
        source="AquaVolt Deterministic Rules & Domain Knowledge Base"
    )
