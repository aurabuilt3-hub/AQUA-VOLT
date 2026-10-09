"""AquaVolt Deterministic Decision Engine (Phase 10).

Executes all arithmetic, load prioritization, and rule-based scheduling
without relying on an LLM for critical numerical logic.
"""

from typing import Dict, Any, List, Tuple
from app.models.schemas import (
    NormalizedAquaVoltState, ActionPlanItem, SoftStartRigState, ThermalPrecoolRigState
)

# Configurable equipment parameters
INVERTER_MAX_KW = 22.0
BATTERY_RESERVE_FLOOR_PCT = 20.0
CRITICAL_DO_THRESHOLD = 3.5
WARNING_DO_THRESHOLD = 4.0
COLD_ROOM_MAX_SAFE_TEMP = 5.0
SOLAR_PRECOOLING_THRESHOLD_KW = 14.0
PRECOOLING_TARGET_TEMP = 1.5


def evaluate_load_priorities(
    state: NormalizedAquaVoltState,
    pond_risk: str = "low",
    cold_risk: str = "low"
) -> Tuple[List[ActionPlanItem], List[ActionPlanItem], List[ActionPlanItem]]:
    """Deterministically categorizes loads into Keep Running, Defer/Reduce, and Energy Strategy."""
    keep_running: List[ActionPlanItem] = []
    defer_or_reduce: List[ActionPlanItem] = []
    energy_strategy: List[ActionPlanItem] = []

    # 1. P1 CRITICAL LOADS
    # Aeration is ALWAYS P1 when DO is low or normal operating mode
    is_aeration_critical = state.pond_do < WARNING_DO_THRESHOLD or pond_risk in ("warning", "critical")
    keep_running.append(ActionPlanItem(
        id="load_aerators",
        category="keep",
        title="🐟 Pond Aerator VFD Soft-Start Rig",
        description="Life-critical oxygen circulation. Clamped to safe 6.4 kW peak via VFD frequency ramp.",
        power_kw=6.4 if state.aerator_status == "soft_start_active" else 6.4,
        status="PROTECTED (P1 Priority)",
        tag="Life Critical"
    ))

    # Cold Storage Refrigeration
    is_cold_critical = state.cold_room_temperature > 4.5 or cold_risk in ("warning", "critical")
    keep_running.append(ActionPlanItem(
        id="load_refrigeration",
        category="keep",
        title="❄️ Cold Storage Refrigeration Unit",
        description=f"Cold room at {state.cold_room_temperature:.1f}°C. Compressor maintained to protect harvest stock.",
        power_kw=3.2,
        status="ACTIVE (P1 Priority)",
        tag="Product Preservation"
    ))

    # Water circulation pumps
    keep_running.append(ActionPlanItem(
        id="load_pumps",
        category="keep",
        title="💧 Water Circulation Pumps",
        description="Continuous bio-filter water turnover and pond flushing.",
        power_kw=2.1,
        status="RUNNING",
        tag="Water Quality"
    ))

    # 2. FLEXIBLE LOADS (Deficit shedding / Load shifting)
    # Check if we have an energy deficit or low battery/grid outage
    net_solar_balance = state.solar_kw - (6.4 + 3.2 + 2.1)
    must_defer_flexible = (
        state.solar_kw < 12.0
        or state.battery_soc < 40.0
        or not state.grid_available
        or state.total_load_kw > INVERTER_MAX_KW
    )

    if must_defer_flexible:
        defer_or_reduce.append(ActionPlanItem(
            id="load_ice_plant",
            category="defer",
            title="🧊 Ice Production Plant (Batch Pause)",
            description="Deferred for 45 minutes to protect 20% battery reserve and life-critical loads.",
            power_kw=3.0,
            status="DEFERRED (45m hold)",
            tag="Flexible Load"
        ))
        defer_or_reduce.append(ActionPlanItem(
            id="load_processing",
            category="defer",
            title="🏭 Shrimp Processing Line (Shift Window)",
            description="Shifted to next high-solar generation cycle. Zero impact on product quality.",
            power_kw=4.0,
            status="DEFERRED",
            tag="Flexible Load"
        ))
    else:
        keep_running.append(ActionPlanItem(
            id="load_ice_plant",
            category="keep",
            title="🧊 Ice Production Plant",
            description="Running on available solar surplus.",
            power_kw=3.0,
            status="RUNNING",
            tag="Flexible Load"
        ))
        keep_running.append(ActionPlanItem(
            id="load_processing",
            category="keep",
            title="🏭 Shrimp Processing Line",
            description="Operating within standard production shift.",
            power_kw=4.0,
            status="RUNNING",
            tag="Flexible Load"
        ))

    # Auxiliary Lighting
    if state.solar_kw < 8.0 or state.battery_soc < 30.0:
        defer_or_reduce.append(ActionPlanItem(
            id="load_lighting",
            category="defer",
            title="💡 Auxiliary Facility Lighting",
            description="Dimmed to 50% non-essential perimeter security levels.",
            power_kw=0.4,
            status="REDUCED (50% dim)",
            tag="Auxiliary"
        ))
    else:
        keep_running.append(ActionPlanItem(
            id="load_lighting",
            category="keep",
            title="💡 Facility Lighting",
            description="Full operational illumination active.",
            power_kw=0.8,
            status="NORMAL",
            tag="Auxiliary"
        ))

    # 3. ENERGY STRATEGY ITEMS
    if state.battery_soc < BATTERY_RESERVE_FLOOR_PCT:
        b_desc = f"CRITICAL: Battery at {state.battery_soc:.0f}% floor. Discharge locked to prevent complete blackout."
        b_status = "LOCKED FLOOR"
    elif state.solar_kw > SOLAR_PRECOOLING_THRESHOLD_KW:
        b_desc = f"Solar surplus ({state.solar_kw:.1f} kW) charging battery and powering pre-cooling."
        b_status = "CHARGING"
    elif not state.grid_available:
        b_desc = f"Microgrid standalone island mode. Discharging to support critical aeration and refrigeration."
        b_status = "DISCHARGING (Controlled)"
    else:
        b_desc = f"Battery SOC at {state.battery_soc:.0f}%. Operating in optimized buffer reserve mode."
        b_status = "STANDBY RESERVE"

    energy_strategy.append(ActionPlanItem(
        id="strat_battery",
        category="strategy",
        title="🔋 Battery Microgrid Strategy",
        description=b_desc,
        power_kw=0.0,
        status=b_status,
        tag="Storage"
    ))

    g_status = "CONNECTED (Standby)" if state.grid_available else "ISLAND MODE (Offline)"
    g_desc = "Grid synchronised for emergency peak demand support." if state.grid_available else "Outage detected. Microgrid islanded with automatic frequency regulation."
    energy_strategy.append(ActionPlanItem(
        id="strat_grid",
        category="strategy",
        title="🔌 Grid Tie / Islanding Mode",
        description=g_desc,
        power_kw=0.0,
        status=g_status,
        tag="Supply"
    ))

    return keep_running, defer_or_reduce, energy_strategy


def evaluate_soft_start_rig(
    state: NormalizedAquaVoltState,
    inrush_risk: bool = False
) -> SoftStartRigState:
    """Calculates VFD Soft-Start parameters."""
    enabled = inrush_risk or state.inrush_surge_kw > 10.0 or state.aerator_status in ("soft_start_active", "standby")
    prevented_kw = 12.1 if enabled else 0.0

    return SoftStartRigState(
        enabled=enabled,
        ramp_duration_sec=120,
        stagger_interval_sec=30,
        peak_inrush_prevented_kw=prevented_kw,
        motor_wear_reduction_pct=35.0,
        current_step="VFD Frequency Ramp (0 → 50 Hz over 120s; 30s staggered start)" if enabled else "Direct-On-Line"
    )


def evaluate_precooling_rig(
    state: NormalizedAquaVoltState,
    thermal_buffer_hours: float = 2.5
) -> ThermalPrecoolRigState:
    """Calculates Thermal Pre-Cooling parameters."""
    is_surplus = state.solar_kw >= SOLAR_PRECOOLING_THRESHOLD_KW and state.cold_room_temperature <= 4.5
    stored_kwh = 6.8 if is_surplus else (3.4 if thermal_buffer_hours >= 2.0 else 1.2)
    safe_off_hours = 4.2 if is_surplus else (thermal_buffer_hours if thermal_buffer_hours > 0 else 1.5)

    if is_surplus:
        status = "ACTIVE — Pre-cooling cold room to 1.5°C using midday solar surplus"
    elif thermal_buffer_hours >= 1.5:
        status = f"BUFFER ENGAGED — {thermal_buffer_hours:.1f}h safe compressor-off window"
    else:
        status = "STANDBY — Standard 4.0°C refrigeration cycle"

    return ThermalPrecoolRigState(
        enabled=is_surplus or thermal_buffer_hours >= 1.5,
        cold_storage_precooled_temp_c=PRECOOLING_TARGET_TEMP if is_surplus else state.cold_room_target,
        thermal_energy_stored_kwh=stored_kwh,
        compressor_safe_off_duration_hours=safe_off_hours,
        solar_surplus_utilized_kw=max(0.0, round(state.solar_kw - 11.2, 1)),
        status=status
    )
