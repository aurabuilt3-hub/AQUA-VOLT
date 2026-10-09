"""PS04 Digital Twin — PoC Simulation & Digital Control Layer (Phases 15, 16, 17).

IMPORTANT NOTICE:
This module represents the PS04 Digital Twin simulation environment.
It models simulated equipment responses for:
  - Solar generation, battery storage, and grid balance
  - Shrimp pond dissolved oxygen & temperature
  - Aerator VFD Soft-Start sequence (inrush suppression)
  - Cold storage thermal pre-cooling (thermal energy buffer)
  - Flexible load contactors (ice plant & processing unit)

This is a Proof-of-Concept (PoC) Digital Control Layer.
It does NOT communicate with or control real physical machinery or live high-voltage hardware.
"""

from typing import Dict, Any, List, Optional
import datetime
from pydantic import BaseModel, Field


class AeratorTwinState(BaseModel):
    total_aerators: int = 4
    running_aerators: int = 4
    mode: str = "VFD_SOFT_START"  # "VFD_SOFT_START" or "DIRECT_ON_LINE"
    frequency_hz: float = 50.0
    ramp_duration_sec: int = 120
    stagger_interval_sec: int = 30
    inrush_suppressed_kw: float = 12.1
    current_power_kw: float = 6.4
    status_text: str = "Simulated VFD Soft-Start Active (Inrush Clamped to 6.4 kW)"


class ColdStorageTwinState(BaseModel):
    current_temp_c: float = 4.0
    target_temp_c: float = 4.0
    compressor_status: str = "RUNNING"  # "RUNNING", "PRECOOLING", "BUFFER_FLOAT", "PAUSED"
    thermal_energy_stored_kwh: float = 0.0
    compressor_safe_off_hours: float = 2.5
    precooled_active: bool = False
    power_kw: float = 3.2
    status_text: str = "Standard 4.0°C Refrigeration Cycle"


class MicrogridTwinState(BaseModel):
    solar_kw: float = 12.0
    battery_soc_pct: float = 65.0
    battery_reserve_floor_pct: float = 20.0
    battery_mode: str = "STANDBY"  # "CHARGING", "DISCHARGING", "STANDBY", "LOCKED_FLOOR"
    grid_connected: bool = True
    total_load_kw: float = 13.6
    ice_plant_kw: float = 3.0
    ice_plant_status: str = "RUNNING"
    processing_kw: float = 4.0
    processing_status: str = "RUNNING"
    lighting_kw: float = 0.8


class PS04DigitalTwin:
    def __init__(self):
        self.aerators = AeratorTwinState()
        self.cold_storage = ColdStorageTwinState()
        self.microgrid = MicrogridTwinState()
        self.pond_do_mg_l = 4.5
        self.pond_water_temp_c = 28.0
        self.last_sync_timestamp = datetime.datetime.now().isoformat()
        self.execution_history: List[Dict[str, Any]] = []

    def reset(self):
        """Reset the digital twin to default baseline state."""
        self.aerators = AeratorTwinState()
        self.cold_storage = ColdStorageTwinState()
        self.microgrid = MicrogridTwinState()
        self.pond_do_mg_l = 4.5
        self.pond_water_temp_c = 28.0
        self.last_sync_timestamp = datetime.datetime.now().isoformat()
        self.execution_history = []

    def sync_from_telemetry(self, telemetry: Dict[str, Any]):
        """Synchronize the twin with incoming IoT telemetry."""
        self.solar_kw = float(telemetry.get("solar_gen_kw", telemetry.get("solar_kw", 12.0)))
        self.microgrid.solar_kw = self.solar_kw
        self.microgrid.battery_soc_pct = float(telemetry.get("battery_soc_pct", telemetry.get("battery_soc", 65.0)))
        self.microgrid.grid_connected = bool(telemetry.get("grid_available", True))
        self.pond_do_mg_l = float(telemetry.get("pond_dissolved_oxygen_mg_l", telemetry.get("pond_do", 4.5)))
        self.pond_water_temp_c = float(telemetry.get("pond_water_temp_c", telemetry.get("pond_water_temp", 28.0)))
        self.cold_storage.current_temp_c = float(telemetry.get("cold_room_temp_c", telemetry.get("cold_room_temp", 4.0)))
        self.last_sync_timestamp = datetime.datetime.now().isoformat()

    def simulate_start_aerator_soft_start(self, ramp_seconds: int = 120, stagger_seconds: int = 30) -> Dict[str, Any]:
        """Simulate VFD Soft-Start execution: clamps 18.5 kW DOL spike down to 6.4 kW."""
        self.aerators.mode = "VFD_SOFT_START"
        self.aerators.running_aerators = 4
        self.aerators.ramp_duration_sec = ramp_seconds
        self.aerators.stagger_interval_sec = stagger_seconds
        self.aerators.inrush_suppressed_kw = 12.1
        self.aerators.current_power_kw = 6.4
        self.aerators.status_text = f"Simulated VFD Soft-Start Active (0 → 50 Hz ramp / {ramp_seconds}s / {stagger_seconds}s stagger / Inrush Clamped to 6.4 kW)"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "Aerator_VFD_Controller",
            "action": "startAeratorSoftStart",
            "previous_state": "Direct-On-Line Inrush Risk (18.5 kW)",
            "new_state": "VFD Soft-Start Clamped (6.4 kW Peak)",
            "simulated_impact": "Suppressed 12.1 kW peak startup surge; protected inverter breakers."
        }
        self.execution_history.append(log_item)
        return log_item

    def simulate_stop_aerator(self, aerator_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """Simulate stopping non-critical aerators."""
        stopped = len(aerator_ids) if aerator_ids else 2
        self.aerators.running_aerators = max(1, self.aerators.running_aerators - stopped)
        self.aerators.current_power_kw = 1.6 * self.aerators.running_aerators
        self.aerators.status_text = f"Aerators Reduced: {self.aerators.running_aerators}/4 Active ({self.aerators.current_power_kw:.1f} kW)"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "Aerator_VFD_Controller",
            "action": "stopAerator",
            "previous_state": "All Aerators Active",
            "new_state": f"{self.aerators.running_aerators} Active",
            "simulated_impact": f"Reduced load demand by {stopped * 1.6:.1f} kW."
        }
        self.execution_history.append(log_item)
        return log_item

    def simulate_start_precooling(self, target_temp_c: float = 1.5) -> Dict[str, Any]:
        """Simulate Thermal Pre-Cooling with midday solar surplus."""
        self.cold_storage.target_temp_c = target_temp_c
        self.cold_storage.compressor_status = "PRECOOLING"
        self.cold_storage.precooled_active = True
        self.cold_storage.thermal_energy_stored_kwh = 6.8
        self.cold_storage.compressor_safe_off_hours = 4.2
        self.cold_storage.status_text = f"Simulated Thermal Pre-Cooling Engaged (Target: {target_temp_c:.1f}°C, Buffer: 6.8 kWh)"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "Cold_Storage_Compressor",
            "action": "startPrecooling",
            "previous_state": f"Standard Setpoint ({self.cold_storage.current_temp_c:.1f}°C)",
            "new_state": f"Pre-cooling Setpoint ({target_temp_c:.1f}°C)",
            "simulated_impact": "Created 6.8 kWh cold buffer (4.2 hours compressor float)."
        }
        self.execution_history.append(log_item)
        return log_item

    def simulate_reduce_cooling_load(self) -> Dict[str, Any]:
        """Simulate compressor floating using previously stored thermal buffer."""
        self.cold_storage.compressor_status = "BUFFER_FLOAT"
        self.cold_storage.power_kw = 0.4  # Fan only
        self.cold_storage.status_text = "Compressor Paused — Utilizing Thermal Buffer"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "Cold_Storage_Compressor",
            "action": "reduceCoolingLoad",
            "previous_state": "Compressor Active (3.2 kW)",
            "new_state": "Thermal Buffer Floating (0.4 kW circulation)",
            "simulated_impact": "Saved 2.8 kW compressor power while holding safe temperature."
        }
        self.execution_history.append(log_item)
        return log_item

    def simulate_pause_ice_production(self, duration_minutes: int = 45) -> Dict[str, Any]:
        """Simulate pausing ice plant contactor."""
        self.microgrid.ice_plant_kw = 0.0
        self.microgrid.ice_plant_status = f"PAUSED ({duration_minutes}m)"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "Ice_Plant_Contactor",
            "action": "pauseIceProduction",
            "previous_state": "Running (3.0 kW)",
            "new_state": f"Paused ({duration_minutes}m deferral)",
            "simulated_impact": "Shed 3.0 kW load; preserved battery reserve floor."
        }
        self.execution_history.append(log_item)
        return log_item

    def simulate_pause_processing(self, duration_minutes: int = 60) -> Dict[str, Any]:
        """Simulate pausing processing line contactor."""
        self.microgrid.processing_kw = 0.0
        self.microgrid.processing_status = f"PAUSED ({duration_minutes}m)"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "Processing_Line_Contactor",
            "action": "pauseProcessing",
            "previous_state": "Running (4.0 kW)",
            "new_state": f"Paused ({duration_minutes}m deferral)",
            "simulated_impact": "Shed 4.0 kW load; avoided microgrid blackout."
        }
        self.execution_history.append(log_item)
        return log_item

    def simulate_maintain_battery_reserve(self, floor_soc_pct: float = 20.0) -> Dict[str, Any]:
        """Simulate BMS discharge floor lock."""
        self.microgrid.battery_reserve_floor_pct = floor_soc_pct
        self.microgrid.battery_mode = "LOCKED_FLOOR"

        log_item = {
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "component": "BMS_Controller",
            "action": "maintainBatteryReserve",
            "previous_state": "Unrestricted Discharge",
            "new_state": f"Floor Locked ({floor_soc_pct:.0f}% SOC)",
            "simulated_impact": f"Emergency reserve floor locked at {floor_soc_pct:.0f}%; prevents sudden shutdown."
        }
        self.execution_history.append(log_item)
        return log_item

    def get_full_state(self) -> Dict[str, Any]:
        """Return full snapshot of the Digital Twin state."""
        return {
            "is_simulation": True,
            "disclaimer": "PoC Digital Control Layer — Simulated equipment response only.",
            "sync_timestamp": self.last_sync_timestamp,
            "aerator_rig": self.aerators.model_dump(),
            "cold_storage_rig": self.cold_storage.model_dump(),
            "microgrid": self.microgrid.model_dump(),
            "pond": {
                "dissolved_oxygen_mg_l": self.pond_do_mg_l,
                "water_temperature_c": self.pond_water_temp_c,
                "status": "SAFE" if self.pond_do_mg_l >= 4.0 else "WARNING"
            },
            "recent_actions": self.execution_history[-10:]
        }


# Global singleton instance of the PS04 Digital Twin
digital_twin = PS04DigitalTwin()
