import React from 'react';
import { IoTTelemetry } from '../types';

interface SituationCardProps {
  telemetry: IoTTelemetry;
}

export const SituationCard: React.FC<SituationCardProps> = ({ telemetry }) => {
  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 shadow-card-float h-full flex flex-col">
      {/* Step Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
          3
        </span>
        <h2 className="text-lg font-extrabold text-[#063B5C]">Current Telemetry State</h2>
      </div>
      <p className="text-xs text-[#64748B] mb-3.5 pl-9 font-medium">
        Telemetry feeds linked directly to microgrid sensors & pond probes.
      </p>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[520px]">
        {/* 1. Energy System */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-extrabold text-[#063B5C] flex items-center gap-1.5 mb-2.5">
            <span>☀️</span> Energy System
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Solar Gen:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.solar_gen_kw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Battery SOC:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.battery_soc_pct.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Grid Line:</span>
              <span className={`font-extrabold ${telemetry.grid_available ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {telemetry.grid_available ? 'Connected' : 'Outage'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Genset:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.diesel_gen_running ? 'RUNNING' : 'OFF'}</span>
            </div>
          </div>
        </div>

        {/* 2. Pond Health */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-extrabold text-[#063B5C] flex items-center gap-1.5 mb-2.5">
            <span>🐟</span> Pond Health
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Dissolved O₂:</span>
              <span className={`font-extrabold ${telemetry.pond_dissolved_oxygen_mg_l < 3.5 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {telemetry.pond_dissolved_oxygen_mg_l.toFixed(1)} mg/L
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Water Temp:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.pond_water_temp_c.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Aerators:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.aerators_running} / {telemetry.aerators_total} ON</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Inrush Peak:</span>
              <span className="font-extrabold text-[#F59E0B]">
                {telemetry.inrush_surge_kw > 0 ? `${telemetry.inrush_surge_kw} kW` : '0 kW (Clamped)'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Cold Chain */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-extrabold text-[#063B5C] flex items-center gap-1.5 mb-2.5">
            <span>❄️</span> Cold Chain
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Room Temp:</span>
              <span className={`font-extrabold ${telemetry.cold_room_temp_c > 5.0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                {telemetry.cold_room_temp_c.toFixed(1)}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Target Range:</span>
              <span className="font-extrabold text-[#063B5C]">1.5 – 4.0°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Pre-Cooling:</span>
              <span className={`font-extrabold ${telemetry.thermal_precooling_active ? 'text-[#00B8D9]' : 'text-[#64748B]'}`}>
                {telemetry.thermal_precooling_active ? 'ACTIVE (1.5°C)' : 'Standby'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Thermal Buffer:</span>
              <span className="font-extrabold text-[#10B981]">{telemetry.thermal_buffer_hours.toFixed(1)} Hours</span>
            </div>
          </div>
        </div>

        {/* 4. Deferrable Loads */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="text-xs font-extrabold text-[#063B5C] flex items-center gap-1.5 mb-2.5">
            <span>⚙️</span> Deferrable Loads
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Pumps:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.pumps_kw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Ice Plant:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.ice_plant_kw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Processing:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.processing_plant_kw.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-medium">Aux Lighting:</span>
              <span className="font-extrabold text-[#063B5C]">{telemetry.lighting_kw.toFixed(1)} kW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
