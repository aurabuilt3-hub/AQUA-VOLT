import React from 'react';
import { IoTTelemetry } from '../types';

interface MetricsBannerProps {
  telemetry: IoTTelemetry;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ telemetry }) => {
  const estimatedLoad = (telemetry.aerators_running * 1.6) + 3.2 + telemetry.pumps_kw + telemetry.ice_plant_kw + telemetry.processing_plant_kw;
  const solarGen = telemetry.solar_gen_kw;
  const batterySoc = telemetry.battery_soc_pct;
  const pondDo = telemetry.pond_dissolved_oxygen_mg_l;
  const coldTemp = telemetry.cold_room_temp_c;
  const isGridAvailable = telemetry.grid_available;

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* 1. SOLAR GENERATION */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#64748B]">☀️ Solar Gen</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/30">
            {solarGen > 14 ? '+12% Good' : solarGen < 8 ? 'Low Solar' : 'Normal'}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-extrabold text-[#063B5C] font-sans tracking-tight">
            {solarGen.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-[#64748B]">kW</span>
        </div>
        {/* SVG Mini Sparkline */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <svg className="w-full h-6 stroke-[#00B8D9] fill-none" viewBox="0 0 100 24">
            <path strokeWidth="2.5" strokeLinecap="round" d="M0,18 Q25,8 50,14 T100,6" />
          </svg>
        </div>
        <div className="h-1 bg-[#EFFBFC] rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00B8D9] to-[#36D7E8] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (solarGen / 20) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. BATTERY SOC */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#64748B]">🔋 Battery SOC</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            batterySoc < 20 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-[#E0F7FA] text-[#14B8A6] border-[#14B8A6]/30'
          }`}>
            {batterySoc < 20 ? 'Critical' : batterySoc > 70 ? 'Healthy' : 'Optimal'}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-2xl font-extrabold font-sans tracking-tight ${
            batterySoc < 20 ? 'text-[#EF4444]' : 'text-[#063B5C]'
          }`}>
            {batterySoc.toFixed(0)}%
          </span>
          <span className="text-[10px] font-semibold text-[#64748B]">20% Floor</span>
        </div>
        {/* SVG Mini Sparkline */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <svg className="w-full h-6 stroke-[#14B8A6] fill-none" viewBox="0 0 100 24">
            <path strokeWidth="2.5" strokeLinecap="round" d="M0,8 Q30,16 60,10 T100,14" />
          </svg>
        </div>
        <div className="h-1 bg-[#EFFBFC] rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              batterySoc < 20 ? 'bg-[#EF4444]' : batterySoc < 40 ? 'bg-[#F59E0B]' : 'bg-gradient-to-r from-[#14B8A6] to-[#5EEAD4]'
            }`}
            style={{ width: `${batterySoc}%` }}
          />
        </div>
      </div>

      {/* 3. CURRENT LOAD */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#64748B]">⚡ Current Load</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/30">
            Normal
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-extrabold text-[#063B5C] font-sans tracking-tight">
            {estimatedLoad.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-[#64748B]">kW</span>
        </div>
        {/* SVG Mini Sparkline */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <svg className="w-full h-6 stroke-[#087EA4] fill-none" viewBox="0 0 100 24">
            <path strokeWidth="2.5" strokeLinecap="round" d="M0,14 Q35,6 70,16 T100,10" />
          </svg>
        </div>
        <div className="h-1 bg-[#EFFBFC] rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#087EA4] to-[#00B8D9] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (estimatedLoad / 22) * 100)}%` }}
          />
        </div>
      </div>

      {/* 4. GRID STATUS */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#64748B]">🏭 Grid Status</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            isGridAvailable ? 'bg-emerald-50 text-[#10B981] border-emerald-200' : 'bg-rose-50 text-[#EF4444] border-rose-200'
          }`}>
            {isGridAvailable ? 'Standby' : 'Island Mode'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`w-3 h-3 rounded-full animate-pulse ${
            isGridAvailable ? 'bg-[#10B981] shadow-glow-cyan' : 'bg-[#EF4444]'
          }`} />
          <span className={`text-base font-extrabold ${
            isGridAvailable ? 'text-[#063B5C]' : 'text-[#EF4444]'
          }`}>
            {isGridAvailable ? 'Connected' : 'Grid Outage'}
          </span>
        </div>
        <div className="text-[10px] font-medium text-[#64748B] mt-2 flex items-center justify-between">
          <span>Microgrid Sync</span>
          <span className="font-bold text-[#087EA4]">Active</span>
        </div>
      </div>

      {/* 5. POND DO */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#64748B]">💧 Pond DO</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            pondDo < 3.5 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-[#10B981] border-emerald-200'
          }`}>
            {pondDo < 3.5 ? 'Low DO' : 'Normal'}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-2xl font-extrabold font-sans tracking-tight ${
            pondDo < 3.5 ? 'text-[#EF4444]' : 'text-[#063B5C]'
          }`}>
            {pondDo.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-[#64748B]">mg/L</span>
        </div>
        <div className="text-[10px] font-semibold text-[#087EA4] mt-2 flex items-center justify-between">
          <span>Soft-Start Rig</span>
          <span className="font-bold">{telemetry.aerator_soft_start_active ? 'VFD Ready' : 'Direct'}</span>
        </div>
      </div>

      {/* 6. COLD ROOM */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-[#64748B]">❄️ Cold Room</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            coldTemp > 5.0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-cyan-50 text-[#00B8D9] border-[#00B8D9]/30'
          }`}>
            {coldTemp > 5.0 ? 'High Temp' : 'Normal'}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-2xl font-extrabold font-sans tracking-tight ${
            coldTemp > 5.0 ? 'text-[#F59E0B]' : 'text-[#063B5C]'
          }`}>
            {coldTemp.toFixed(1)}
          </span>
          <span className="text-xs font-bold text-[#64748B]">°C</span>
        </div>
        <div className="text-[10px] font-semibold text-[#00B8D9] mt-2 flex items-center justify-between">
          <span>Thermal Buffer</span>
          <span className="font-bold">{telemetry.thermal_buffer_hours.toFixed(1)} hrs</span>
        </div>
      </div>
    </section>
  );
};
