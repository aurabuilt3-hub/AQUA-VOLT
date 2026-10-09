"""AquaVolt Normalized Shared State & Context Engine (Phase 7).

Normalizes incoming IoT telemetry and farm state into a compact, standardized
data structure for specialist agents and the orchestrator.
"""

from typing import Dict, Any, Optional
import datetime
from app.models.schemas import IoTEvent, FarmState, NormalizedAquaVoltState


def normalize_event_state(event: IoTEvent) -> NormalizedAquaVoltState:
    """Extract and normalize state from an IoTEvent."""
    e = event.energy_state
    b = event.battery_state
    p = event.pond_state
    c = event.cold_chain_state
    eq = event.equipment_state
    t = event.telemetry

    # Derive operational statuses
    if eq.aerator_soft_start_active:
        aerator_status = "soft_start_active"
    elif p.aerators_on > 0:
        aerator_status = "running"
    else:
        aerator_status = "standby"

    if c.thermal_precooling_active:
        cooling_status = "precooling"
    elif c.cold_room_temp > c.cold_room_target_max:
        cooling_status = "running"
    else:
        cooling_status = "running"

    ice_status = "paused" if eq.ice_plant_kw == 0 else "running"
    proc_status = "paused" if eq.processing_kw == 0 else "running"

    return NormalizedAquaVoltState(
        timestamp=event.timestamp or datetime.datetime.now().isoformat(),
        solar_kw=round(e.solar_kw, 2),
        battery_soc=round(b.battery_soc, 1),
        grid_available=e.grid_available,
        pond_do=round(p.pond_do, 2),
        pond_temperature=round(p.pond_water_temp, 1),
        cold_room_temperature=round(c.cold_room_temp, 2),
        cold_room_target=round(c.cold_room_target_min, 1),
        aerator_status=aerator_status,
        cooling_status=cooling_status,
        ice_plant_status=ice_status,
        processing_status=proc_status,
        inrush_surge_kw=round(eq.inrush_surge_kw, 1),
        total_load_kw=round(e.total_load_kw, 2)
    )


def normalize_farm_state(farm_state: FarmState) -> NormalizedAquaVoltState:
    """Normalize state from FarmState."""
    e = farm_state.energy_state
    b = farm_state.battery_state
    p = farm_state.pond_state
    c = farm_state.cold_chain_state
    eq = farm_state.equipment_state

    aerator_status = "soft_start_active" if eq.aerator_soft_start_active else ("running" if p.aerators_on > 0 else "standby")
    cooling_status = "precooling" if c.thermal_precooling_active else "running"
    ice_status = "paused" if eq.ice_plant_kw == 0 else "running"
    proc_status = "paused" if eq.processing_kw == 0 else "running"

    return NormalizedAquaVoltState(
        timestamp=farm_state.timestamp or datetime.datetime.now().isoformat(),
        solar_kw=round(e.solar_kw, 2),
        battery_soc=round(b.battery_soc, 1),
        grid_available=e.grid_available,
        pond_do=round(p.pond_do, 2),
        pond_temperature=round(p.pond_water_temp, 1),
        cold_room_temperature=round(c.cold_room_temp, 2),
        cold_room_target=round(c.cold_room_target_min, 1),
        aerator_status=aerator_status,
        cooling_status=cooling_status,
        ice_plant_status=ice_status,
        processing_status=proc_status,
        inrush_surge_kw=round(eq.inrush_surge_kw, 1),
        total_load_kw=round(e.total_load_kw, 2)
    )
