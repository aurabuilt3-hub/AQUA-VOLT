import React from 'react';
import { SoftStartRigState, ThermalPrecoolRigState, IoTTelemetry } from '../types';

interface PS04DigitalTwinProps {
  softStart?: SoftStartRigState;
  thermalPrecool?: ThermalPrecoolRigState;
  telemetry?: IoTTelemetry | null;
  twinState?: any;
}

export const PS04DigitalTwin: React.FC<PS04DigitalTwinProps> = ({
  softStart,
  thermalPrecool,
  telemetry,
  twinState
}) => {
  const solarKw = twinState?.microgrid?.solar_kw ?? telemetry?.solar_gen_kw ?? 8.4;
  const batterySoc = twinState?.microgrid?.battery_soc_pct ?? telemetry?.battery_soc_pct ?? 72;
  const coldTemp = twinState?.cold_storage_rig?.current_temp_c ?? telemetry?.cold_room_temp_c ?? 3.8;
  const isSolarLow = solarKw < 8.0;
  const aeratorKw = twinState?.aerator_rig?.current_power_kw ?? (softStart?.enabled ? 6.4 : 18.5);
  const flexibleKw = twinState?.microgrid
    ? ((twinState.microgrid.ice_plant_kw || 0) + (twinState.microgrid.processing_kw || 0))
    : (isSolarLow ? 0.0 : 7.0);

  return (
    <div className="bg-white text-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-sky-100 relative overflow-hidden my-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-sky-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm">
              ⚡
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Modeled Energy Flow & Microgrid Topology
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital Twin · Simulated equipment · No physical hardware connected
          </p>
        </div>

        <span className="text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
          Simulated Equipment
        </span>
      </div>

      {/* Schematic Microgrid Facility Flow */}
      <div className="relative py-6 my-2 min-h-[300px] flex items-center justify-center">
        {/* Animated SVG Energy Flow Lines overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 300" preserveAspectRatio="none">
          {/* Solar to Controller */}
          <path
            d="M 130 75 L 400 150"
            stroke={isSolarLow ? '#CBD5E1' : '#087F8C'}
            strokeWidth="2.5"
            className={isSolarLow ? '' : 'animate-flow-dash'}
            strokeDasharray="6 4"
          />

          {/* Controller to Battery */}
          <path
            d="M 400 150 L 250 240"
            stroke="#18A999"
            strokeWidth="2.5"
            className="animate-flow-dash"
            strokeDasharray="6 4"
          />

          {/* Controller to Aerators/Pond */}
          <path
            d="M 400 150 L 550 75"
            stroke="#087F8C"
            strokeWidth="2.5"
            className="animate-flow-dash"
            strokeDasharray="6 4"
          />

          {/* Controller to Cold Storage */}
          <path
            d="M 400 150 L 670 170"
            stroke="#0284C7"
            strokeWidth="2.5"
            className="animate-flow-dash"
            strokeDasharray="6 4"
          />

          {/* Controller to Flexible Loads */}
          <path
            d="M 400 150 L 550 250"
            stroke={flexibleKw === 0 ? '#CBD5E1' : '#E9A23B'}
            strokeWidth="2.5"
            className={flexibleKw === 0 ? '' : 'animate-flow-dash'}
            strokeDasharray="6 4"
          />
        </svg>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 w-full relative z-10 px-2">

          {/* NODE 1: Solar Array */}
          <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-xl">☀️</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                PV ARRAY
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Solar Generation</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{solarKw.toFixed(1)} kW</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isSolarLow ? '⚠️ Low Generation' : '✓ Active generation window'}
            </div>
          </div>

          {/* NODE 2: AquaVolt Gateway Hub (Central Node with Ocean Teal Accent) */}
          <div className="bg-gradient-to-br from-[#123B4A] to-[#087F8C] text-white border-2 border-teal-400/40 rounded-2xl p-4 shadow-sm text-center relative">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2 shadow-2xs">
              ⚡
            </div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              AquaVolt Energy Gateway
            </div>
            <div className="text-[11px] text-[#A7F3D0] font-medium mt-0.5">
              Microgrid Power Router
            </div>
            <div className="mt-2.5 text-[10px] bg-black/20 rounded-lg border border-white/10 py-1 px-2 text-teal-100 font-medium">
              VFD Ramp + Thermal Pre-Cool Active
            </div>
          </div>

          {/* NODE 3: Aquaculture Pond & Aerators */}
          <div className="bg-white border border-teal-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-xl">🌀</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                LIFE CRITICAL
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Pond Aerators (VFD)</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{aeratorKw.toFixed(1)} kW</div>
            <div className="text-[11px] text-teal-700 font-medium mt-1">
              ✓ Inrush Clamped (120s Ramp)
            </div>
          </div>

          {/* NODE 4: Battery Storage */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-xl">🔋</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                20% FLOOR
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">BESS Storage SOC</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{batterySoc.toFixed(0)}%</div>
            <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${batterySoc}%` }} />
            </div>
          </div>

          {/* NODE 5: Cold Storage Facility */}
          <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-xl">❄️</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                THERMAL BUFFER
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Cold Room Temperature</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{coldTemp.toFixed(1)}°C</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Target: {thermalPrecool?.enabled ? '1.5°C Pre-Cool' : '4.0°C Standard'}
            </div>
          </div>

          {/* NODE 6: Flexible Loads */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-xl">🏭</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                flexibleKw === 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {flexibleKw === 0 ? 'PAUSED / SHED' : 'RUNNING'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">Ice Plant & Processing</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{flexibleKw.toFixed(1)} kW</div>
            <div className="text-[11px] text-amber-800 font-medium mt-1">
              {flexibleKw === 0 ? 'Paused (Preserves battery floor)' : 'Operational'}
            </div>
          </div>

        </div>
      </div>

      {/* Digital Twin Control Summary Footer */}
      <div className="pt-3.5 border-t border-sky-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
        <div>
          <span className="text-teal-700 font-bold">Simulated Equipment Topology:</span> Translates operational decisions into modeled VFD ramp states and compressor buffer relays.
        </div>
        <div className="font-semibold text-slate-600">
          Digital Twin · No physical hardware connected
        </div>
      </div>
    </div>
  );
};
