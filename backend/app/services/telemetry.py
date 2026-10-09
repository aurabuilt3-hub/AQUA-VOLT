from typing import List, Dict, Optional
import datetime
from app.models.schemas import (
    IoTEvent, IoTTelemetry, EnergyState, BatteryState,
    PondState, ColdChainState, EquipmentState, FarmState
)

# Active state tracking
_ACTIVE_EVENT_ID: str = "SOLAR_DROP_60"

def _make_telemetry(e: EnergyState, b: BatteryState, p: PondState, c: ColdChainState, eq: EquipmentState) -> IoTTelemetry:
    return IoTTelemetry(
        solar_gen_kw=e.solar_kw,
        battery_soc_pct=b.battery_soc,
        grid_available=e.grid_available,
        diesel_gen_running=e.diesel_gen_running,
        pond_dissolved_oxygen_mg_l=p.pond_do,
        pond_water_temp_c=p.pond_water_temp,
        aerators_total=p.total_aerators,
        aerators_running=p.aerators_on,
        aerator_soft_start_active=eq.aerator_soft_start_active,
        inrush_surge_kw=eq.inrush_surge_kw,
        cold_room_temp_c=c.cold_room_temp,
        cold_room_target_temp_c=c.cold_room_target_min,
        thermal_precooling_active=c.thermal_precooling_active,
        thermal_buffer_hours=c.thermal_buffer_hours,
        pumps_kw=eq.pumps_kw,
        ice_plant_kw=eq.ice_plant_kw,
        processing_plant_kw=eq.processing_kw,
        lighting_kw=eq.lighting_kw
    )

def _build_event(
    event_id: str,
    name: str,
    category: str,
    severity: str,
    icon: str,
    description: str,
    timestamp: str,
    energy: EnergyState,
    battery: BatteryState,
    pond: PondState,
    cold: ColdChainState,
    equipment: EquipmentState,
    measurements: Dict
) -> IoTEvent:
    t = _make_telemetry(energy, battery, pond, cold, equipment)
    return IoTEvent(
        id=event_id,
        name=name,
        category=category,
        severity=severity, # type: ignore
        icon=icon,
        description=description,
        timestamp=timestamp,
        energy_state=energy,
        battery_state=battery,
        pond_state=pond,
        cold_chain_state=cold,
        equipment_state=equipment,
        relevant_measurements=measurements,
        telemetry=t
    )

PRESET_EVENTS: List[IoTEvent] = [
    # 1. Solar generation dropped 60%
    _build_event(
        event_id="SOLAR_DROP_60",
        name="Solar generation dropped 60%",
        category="solar",
        severity="high",
        icon="☀️",
        description="Sudden cloud cover reduced solar output from 18.4 kW to 4.1 kW (60% drop). Load deficit detected.",
        timestamp="2026-10-02T13:00:00Z",
        energy=EnergyState(solar_kw=4.1, solar_drop_percent=60.0, grid_available=True, total_load_kw=18.3),
        battery=BatteryState(battery_soc=38.0, battery_voltage=48.0, battery_health_pct=95.0),
        pond=PondState(pond_do=4.2, pond_do_trend="falling", pond_water_temp=28.1, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=4.3, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=2.5),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"solar_kw": 4.1, "solar_drop_percent": 60, "battery_soc": 38, "pond_do": 4.2, "cold_room_temp": 4.3, "total_load_kw": 18.3, "grid_available": True}
    ),
    # 2. Battery below 20%
    _build_event(
        event_id="BATTERY_LOW_20",
        name="Battery below 20%",
        category="battery",
        severity="high",
        icon="🔋",
        description="Battery SOC dropped to critical 18% reserve floor. Load shedding of non-essential loads mandatory.",
        timestamp="2026-10-02T13:05:00Z",
        energy=EnergyState(solar_kw=10.1, solar_drop_percent=15.0, grid_available=False, total_load_kw=16.3),
        battery=BatteryState(battery_soc=18.0, battery_voltage=45.2, battery_health_pct=92.0),
        pond=PondState(pond_do=4.6, pond_do_trend="stable", pond_water_temp=28.0, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=4.1, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=2.0),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"solar_kw": 10.1, "battery_soc": 18, "grid_available": False, "pond_do": 4.6, "cold_room_temp": 4.1, "total_load_kw": 16.3}
    ),
    # 3. Pond dissolved oxygen falling
    _build_event(
        event_id="POND_DO_FALLING",
        name="Pond dissolved oxygen falling",
        category="oxygen",
        severity="high",
        icon="🐟",
        description="Dissolved oxygen in Pond #2 dropped to 2.9 mg/L. Emergency aerator soft-start boost required.",
        timestamp="2026-10-02T13:10:00Z",
        energy=EnergyState(solar_kw=12.2, solar_drop_percent=0.0, grid_available=True, total_load_kw=15.5),
        battery=BatteryState(battery_soc=52.0, battery_voltage=48.5, battery_health_pct=96.0),
        pond=PondState(pond_do=2.9, pond_do_trend="falling", pond_water_temp=29.4, aerators_on=2, total_aerators=6),
        cold=ColdChainState(cold_room_temp=4.1, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=3.0),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=18.5),
        measurements={"pond_do": 2.9, "pond_do_trend": "falling", "aerators_on": 2, "total_aerators": 6, "pond_water_temp": 29.4, "solar_kw": 12.2}
    ),
    # 4. Cold room temperature rising
    _build_event(
        event_id="COLD_ROOM_TEMP_RISING",
        name="Cold room temperature rising",
        category="cold",
        severity="high",
        icon="❄️",
        description="Cold room temperature rose to 6.2°C, exceeding 5.0°C safety limit. Thermal pre-cooling boost needed.",
        timestamp="2026-10-02T13:15:00Z",
        energy=EnergyState(solar_kw=11.5, solar_drop_percent=10.0, grid_available=True, total_load_kw=16.8),
        battery=BatteryState(battery_soc=48.0, battery_voltage=47.8, battery_health_pct=94.0),
        pond=PondState(pond_do=4.8, pond_do_trend="stable", pond_water_temp=28.2, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=6.2, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=True, thermal_buffer_hours=1.2),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"cold_room_temp": 6.2, "target_max": 5.0, "thermal_buffer_hours": 1.2, "solar_kw": 11.5, "battery_soc": 48}
    ),
    # 5. Grid failure detected
    _build_event(
        event_id="GRID_FAILURE",
        name="Grid failure detected",
        category="grid",
        severity="high",
        icon="⚡",
        description="Main electrical grid power lost. Microgrid switching to solar + battery island mode.",
        timestamp="2026-10-02T13:20:00Z",
        energy=EnergyState(solar_kw=9.2, solar_drop_percent=20.0, grid_available=False, total_load_kw=14.2),
        battery=BatteryState(battery_soc=62.0, battery_voltage=49.0, battery_health_pct=96.0),
        pond=PondState(pond_do=4.4, pond_do_trend="stable", pond_water_temp=28.0, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=4.2, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=3.5),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"grid_available": False, "solar_kw": 9.2, "battery_soc": 62, "total_load_kw": 14.2}
    ),
    # 6. Pond temperature above threshold
    _build_event(
        event_id="POND_TEMP_HIGH",
        name="Pond temperature above threshold",
        category="temp",
        severity="med",
        icon="🌡️",
        description="Pond water temperature reached 30.5°C (Threshold: 29.5°C). High temperature reduces oxygen solubility.",
        timestamp="2026-10-02T13:25:00Z",
        energy=EnergyState(solar_kw=13.1, solar_drop_percent=0.0, grid_available=True, total_load_kw=16.0),
        battery=BatteryState(battery_soc=56.0, battery_voltage=48.2, battery_health_pct=95.0),
        pond=PondState(pond_do=4.7, pond_do_trend="falling", pond_water_temp=30.5, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=4.2, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=3.0),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"pond_water_temp": 30.5, "threshold_temp": 29.5, "pond_do": 4.7, "solar_kw": 13.1}
    ),
    # 7. Aerator start requested
    _build_event(
        event_id="AERATOR_START_REQUESTED",
        name="Aerator start requested",
        category="aerator",
        severity="med",
        icon="🌀",
        description="Manual request to start 2 additional aerator motors. Direct startup would cause 16.2 kW inrush surge.",
        timestamp="2026-10-02T13:30:00Z",
        energy=EnergyState(solar_kw=12.8, solar_drop_percent=0.0, grid_available=True, total_load_kw=15.2),
        battery=BatteryState(battery_soc=54.0, battery_voltage=48.0, battery_health_pct=95.0),
        pond=PondState(pond_do=3.8, pond_do_trend="falling", pond_water_temp=28.3, aerators_on=3, total_aerators=5),
        cold=ColdChainState(cold_room_temp=4.2, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=2.8),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=16.2),
        measurements={"requested_aerators": 2, "potential_inrush_kw": 16.2, "soft_start_rig_active": True, "solar_kw": 12.8}
    ),
    # 8. Solar generation normal
    _build_event(
        event_id="SOLAR_NORMAL",
        name="Solar generation normal",
        category="solar",
        severity="low",
        icon="☀️",
        description="Optimal midday solar output at 18.4 kW. Ideal window for Thermal Pre-Cooling of Cold Storage.",
        timestamp="2026-10-02T13:35:00Z",
        energy=EnergyState(solar_kw=18.4, solar_drop_percent=0.0, grid_available=True, total_load_kw=11.2),
        battery=BatteryState(battery_soc=72.0, battery_voltage=51.2, battery_health_pct=98.0),
        pond=PondState(pond_do=5.4, pond_do_trend="rising", pond_water_temp=28.1, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=4.1, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=True, thermal_buffer_hours=4.5),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"solar_kw": 18.4, "solar_surplus_kw": 7.2, "thermal_precooling_active": True, "battery_soc": 72}
    ),
    # 9. Battery healthy
    _build_event(
        event_id="BATTERY_HEALTHY",
        name="Battery healthy",
        category="battery",
        severity="low",
        icon="🔋",
        description="Battery pack fully charged at 82% SOC with healthy cell voltages across all banks.",
        timestamp="2026-10-02T13:40:00Z",
        energy=EnergyState(solar_kw=17.1, solar_drop_percent=0.0, grid_available=True, total_load_kw=12.0),
        battery=BatteryState(battery_soc=82.0, battery_voltage=52.0, battery_health_pct=99.0),
        pond=PondState(pond_do=5.2, pond_do_trend="stable", pond_water_temp=27.9, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=4.0, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=4.0),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"battery_soc": 82, "battery_health_pct": 99, "reserve_margin_pct": 62, "solar_kw": 17.1}
    ),
    # 10. Cold chain stable
    _build_event(
        event_id="COLD_CHAIN_STABLE",
        name="Cold chain stable",
        category="cold",
        severity="low",
        icon="❄️",
        description="Cold room temperature perfectly stabilized at 3.8°C with 2.8 tons of harvested shrimp product.",
        timestamp="2026-10-02T13:45:00Z",
        energy=EnergyState(solar_kw=18.0, solar_drop_percent=0.0, grid_available=True, total_load_kw=11.5),
        battery=BatteryState(battery_soc=76.0, battery_voltage=50.8, battery_health_pct=97.0),
        pond=PondState(pond_do=5.5, pond_do_trend="stable", pond_water_temp=27.8, aerators_on=4, total_aerators=4),
        cold=ColdChainState(cold_room_temp=3.8, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=3.8),
        equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
        measurements={"cold_room_temp": 3.8, "product_tons": 2.8, "thermal_buffer_hours": 3.8, "solar_kw": 18.0}
    )
]

# Custom Operational Input template
CUSTOM_EVENT_TEMPLATE: IoTEvent = _build_event(
    event_id="CUSTOM_OPERATIONAL_INPUT",
    name="Custom Operational Observation",
    category="custom",
    severity="low",
    icon="⚡",
    description="User-provided operational telemetry or custom field observation.",
    timestamp="2026-10-02T13:50:00Z",
    energy=EnergyState(solar_kw=18.4, solar_drop_percent=0.0, grid_available=True, total_load_kw=11.2),
    battery=BatteryState(battery_soc=75.0, battery_voltage=51.5, battery_health_pct=98.0),
    pond=PondState(pond_do=5.5, pond_do_trend="stable", pond_water_temp=28.0, aerators_on=4, total_aerators=4),
    cold=ColdChainState(cold_room_temp=4.0, cold_room_target_min=2.0, cold_room_target_max=5.0, thermal_precooling_active=False, thermal_buffer_hours=4.0),
    equipment=EquipmentState(pumps_kw=2.1, ice_plant_kw=3.0, processing_kw=4.0, lighting_kw=0.8, aerator_soft_start_active=True, inrush_surge_kw=0.0),
    measurements={"source": "custom_operational_input"}
)

def get_all_events() -> List[IoTEvent]:
    return PRESET_EVENTS

EVENT_ALIASES: Dict[str, str] = {
    "CUSTOM_OPERATIONAL_INPUT": "CUSTOM_OPERATIONAL_INPUT",
    "CUSTOM": "CUSTOM_OPERATIONAL_INPUT",
    "CUSTOM_INPUT": "CUSTOM_OPERATIONAL_INPUT",
    "LOW_DO": "POND_DO_FALLING",
    "LOW_BATTERY": "BATTERY_LOW_20",
    "COLD_ROOM_HIGH": "COLD_ROOM_TEMP_RISING",
    "AERATOR_START": "AERATOR_START_REQUESTED",
    "SOLAR_SURPLUS": "SOLAR_NORMAL",
    "ENERGY_OVERLOAD": "BATTERY_LOW_20",
    "HIGH_POND_TEMP": "POND_TEMP_HIGH",
    "NORMAL_OPERATION": "SOLAR_NORMAL",
    "NORMAL": "SOLAR_NORMAL",
    "STABLE_BASELINE": "SOLAR_NORMAL",
}

def get_event_by_id(event_id: str) -> IoTEvent:
    resolved_id = EVENT_ALIASES.get(event_id.upper(), event_id)
    if resolved_id == "CUSTOM_OPERATIONAL_INPUT":
        return CUSTOM_EVENT_TEMPLATE
    for event in PRESET_EVENTS:
        if event.id.upper() == resolved_id.upper() or event.id.lower() == resolved_id.lower():
            return event
    # Fallback to solar drop
    return PRESET_EVENTS[0]

def activate_event(event_id: str) -> FarmState:
    global _ACTIVE_EVENT_ID
    event = get_event_by_id(event_id)
    _ACTIVE_EVENT_ID = event.id
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%SZ")

    return FarmState(
        active_event_id=event.id,
        active_event_name=event.name,
        timestamp=now_str,
        energy_state=event.energy_state,
        battery_state=event.battery_state,
        pond_state=event.pond_state,
        cold_chain_state=event.cold_chain_state,
        equipment_state=event.equipment_state,
        relevant_measurements=event.relevant_measurements,
        telemetry=event.telemetry
    )

def get_active_farm_state() -> FarmState:
    return activate_event(_ACTIVE_EVENT_ID)
