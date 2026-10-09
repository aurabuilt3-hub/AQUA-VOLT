from typing import List, Tuple
from app.models.schemas import IoTTelemetry, ActionPlanItem, SoftStartRigState, ThermalPrecoolRigState

def optimize_load_allocation(telemetry: IoTTelemetry) -> Tuple[List[ActionPlanItem], List[ActionPlanItem], List[ActionPlanItem], SoftStartRigState, ThermalPrecoolRigState]:
    solar = telemetry.solar_gen_kw
    soc = telemetry.battery_soc_pct
    grid = telemetry.grid_available
    do = telemetry.pond_dissolved_oxygen_mg_l
    temp = telemetry.cold_room_temp_c

    # Available power estimation
    available_kw = solar + (5.0 if soc > 30 else (2.0 if soc > 20 else 0.0)) + (15.0 if grid else 0.0)

    # Aerator soft start rig calculations
    soft_start_rig = SoftStartRigState(
        enabled=True,
        ramp_duration_sec=120,
        stagger_interval_sec=30,
        peak_inrush_prevented_kw=14.5 if telemetry.aerators_running > 2 else 7.2,
        motor_wear_reduction_pct=35.0,
        current_step="VFD Frequency Ramping (0 → 50 Hz)"
    )

    # Thermal pre-cooling rig calculations
    solar_surplus = max(0.0, solar - 9.0)
    precool_eligible = (solar > 14.0 and temp <= 4.5 and soc > 50.0) or telemetry.thermal_precooling_active
    
    thermal_precool_rig = ThermalPrecoolRigState(
        enabled=precool_eligible,
        cold_storage_precooled_temp_c=1.5 if precool_eligible else 4.0,
        thermal_energy_stored_kwh=6.8 if precool_eligible else (3.2 if temp <= 4.0 else 0.0),
        compressor_safe_off_duration_hours=4.2 if precool_eligible else (2.5 if temp <= 4.0 else 0.8),
        solar_surplus_utilized_kw=round(min(4.5, solar_surplus), 1),
        status="ACTIVE — Thermal Energy Storage Mode (1.5°C)" if precool_eligible else "STANDBY — Operating at Standard 4.0°C"
    )

    keep_running: List[ActionPlanItem] = []
    defer_or_reduce: List[ActionPlanItem] = []
    energy_strategy: List[ActionPlanItem] = []

    # Priority 1: Pond Aeration (Critical for Shrimp Survival)
    aerator_kw = round(telemetry.aerators_running * 1.6, 1)
    if do < 3.5:
        aerator_kw = round(telemetry.aerators_total * 1.6, 1)
        keep_running.append(ActionPlanItem(
            id="aerators",
            category="keep",
            title="🐟 Pond Aerators (Emergency Boost)",
            description=f"All {telemetry.aerators_total} aerators engaged via VFD Soft-Start Rig. DO critical ({do:.1f} mg/L).",
            power_kw=aerator_kw,
            status="active",
            tag="CRITICAL — Oxygen Defense"
        ))
    else:
        keep_running.append(ActionPlanItem(
            id="aerators",
            category="keep",
            title="🐟 Pond Aerators (Soft-Start Managed)",
            description=f"Maintaining {telemetry.aerators_running} aerators. VFD Soft-Start prevents inrush current spike.",
            power_kw=aerator_kw,
            status="active",
            tag="CRITICAL — Soft Start Active"
        ))

    # Priority 2: Cold Storage Refrigeration
    cold_kw = 3.2
    if precool_eligible:
        cold_kw = 4.5  # Extra power for pre-cooling
        keep_running.append(ActionPlanItem(
            id="cold_storage",
            category="keep",
            title="❄️ Cold Storage (Thermal Pre-Cooling)",
            description="Absorbing solar surplus to pre-cool room to 1.5°C. Storing 6.8 kWh thermal buffer.",
            power_kw=cold_kw,
            status="pre_cooling",
            tag="STRATEGIC — Pre-Cooling Active"
        ))
    elif solar < 6.0 and not grid and thermal_precool_rig.thermal_energy_stored_kwh > 2.0:
        # Pre-cooling stored energy allows pausing compressor safely!
        defer_or_reduce.append(ActionPlanItem(
            id="cold_storage",
            category="defer",
            title="❄️ Cold Storage Compressor (Paused)",
            description=f"Thermal pre-cooling buffer active. Temperature safe at {temp:.1f}°C for next {thermal_precool_rig.compressor_safe_off_duration_hours:.1f}h without power.",
            power_kw=0.0,
            status="paused",
            tag="THERMAL BUFFER — Compressor Off"
        ))
    else:
        keep_running.append(ActionPlanItem(
            id="cold_storage",
            category="keep",
            title="❄️ Cold Storage Refrigeration",
            description=f"Maintaining cold chain at target temperature ({temp:.1f}°C). Protects harvest stock.",
            power_kw=cold_kw,
            status="active",
            tag="CRITICAL — Product Protection"
        ))

    # Priority 3: Water Circulation Pumps
    if solar < 5.0 and soc < 25.0:
        defer_or_reduce.append(ActionPlanItem(
            id="pumps",
            category="defer",
            title="💧 Water Circulation Pumps",
            description="Reduced to 50% flow to protect battery reserve.",
            power_kw=1.0,
            status="deferred",
            tag="DEFERRED — Energy Save"
        ))
    else:
        keep_running.append(ActionPlanItem(
            id="pumps",
            category="keep",
            title="💧 Water Circulation Pumps",
            description="Essential pond water filtration & circulation.",
            power_kw=2.1,
            status="active",
            tag="ESSENTIAL — Circulation"
        ))

    # Priority 4: Ice Production & Processing Plant (Flexible/Deferrable Loads)
    if solar < 10.0 or soc < 40.0 or not grid:
        defer_or_reduce.append(ActionPlanItem(
            id="ice_plant",
            category="defer",
            title="🧊 Ice Production Plant",
            description="Paused during power constraint. Flexible load deferral for 45–60 minutes.",
            power_kw=0.0,
            status="deferred",
            tag="DEFERRED — Save 3.0 kW"
        ))
        defer_or_reduce.append(ActionPlanItem(
            id="processing",
            category="defer",
            title="🏭 Shrimp Processing Unit",
            description="Shifted to peak solar window. Paused to preserve battery buffer.",
            power_kw=0.0,
            status="deferred",
            tag="DEFERRED — Save 4.0 kW"
        ))
    else:
        keep_running.append(ActionPlanItem(
            id="ice_plant",
            category="keep",
            title="🧊 Ice Production Plant",
            description="Operating on solar surplus power.",
            power_kw=3.0,
            status="active",
            tag="FLEXIBLE — Solar Powered"
        ))
        keep_running.append(ActionPlanItem(
            id="processing",
            category="keep",
            title="🏭 Shrimp Processing Unit",
            description="Processing line active.",
            power_kw=4.0,
            status="active",
            tag="STANDARD — Active"
        ))

    # Energy Supply Strategy
    energy_strategy.append(ActionPlanItem(
        id="strat_solar",
        category="strategy",
        title="☀️ Solar Allocation",
        description=f"Directing {min(solar, 15.0):.1f} kW solar generation directly to critical loads.",
        power_kw=round(solar, 1),
        status="active",
        tag="RENEWABLE FIRST"
    ))

    energy_strategy.append(ActionPlanItem(
        id="strat_battery",
        category="strategy",
        title="🔋 Battery Management",
        description=f"Maintaining minimum 20% emergency reserve (Current: {soc:.0f}%).",
        power_kw=0.0,
        status="active",
        tag="RESERVE PROTECTED"
    ))

    if grid:
        energy_strategy.append(ActionPlanItem(
            id="strat_grid",
            category="strategy",
            title="🔌 Grid Status",
            description="Grid connected on standby for unexpected peak surges.",
            power_kw=0.0,
            status="active",
            tag="GRID STANDBY"
        ))
    else:
        energy_strategy.append(ActionPlanItem(
            id="strat_grid",
            category="strategy",
            title="🔌 Grid Status",
            description="Grid Unavailable — AquaVolt operating microgrid in standalone island mode.",
            power_kw=0.0,
            status="paused",
            tag="ISLAND MODE"
        ))

    return keep_running, defer_or_reduce, energy_strategy, soft_start_rig, thermal_precool_rig
