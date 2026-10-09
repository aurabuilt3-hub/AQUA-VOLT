import { SoftStartRigState, ThermalPrecoolRigState, IoTTelemetry } from '../types';
import { PS04DigitalTwin } from './PS04DigitalTwin';

interface SoftStartRigVisualizerProps {
  softStart: SoftStartRigState;
  thermalPrecool: ThermalPrecoolRigState;
  telemetry?: IoTTelemetry | null;
  twinState?: any;
}

export const SoftStartRigVisualizer: React.FC<SoftStartRigVisualizerProps> = ({
  softStart,
  thermalPrecool,
  telemetry,
  twinState
}) => {
  return (
    <div className="space-y-6 my-6">
      {/* 3D Isometric Digital Twin Representation */}
      <PS04DigitalTwin softStart={softStart} thermalPrecool={thermalPrecool} telemetry={telemetry} twinState={twinState} />

      {/* Detail Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Aerator Soft Start Rig Card */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-5 shadow-card-float flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">🌀</span> Aerator Soft-Start VFD Rig
              </h3>
              <span className="text-[10px] bg-[#E0F7FA] text-[#087EA4] px-2.5 py-0.5 rounded-full border border-[#00B8D9]/30 font-bold uppercase tracking-wider">
                Inrush Suppressed
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-4 leading-relaxed font-medium">
              Standard aerator startup draws up to 350% inrush current (18.5 kW peak), which trips inverter breakers. AquaVolt's decision layer simulates a VFD frequency ramp over 120s with staggered 30s motor starts — <span className="text-[#087EA4] font-bold">PoC Control Layer</span> for ESP32/VFD deployment.
            </p>

            {/* Inrush Comparison Bar */}
            <div className="space-y-3 bg-[#EFFBFC] p-3.5 rounded-xl border border-[#00B8D9]/20 mb-4">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#EF4444] font-semibold">Without Soft-Start (DOL Inrush):</span>
                  <span className="font-extrabold text-[#EF4444]">18.5 kW Surge ⚠️</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#EF4444] rounded-full w-[95%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#10B981] font-semibold">AquaVolt Soft-Start Rig:</span>
                  <span className="font-extrabold text-[#10B981]">6.4 kW Peak ✓</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#14B8A6] to-[#10B981] rounded-full w-[35%] transition-all duration-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            <div className="bg-[#F5FAFC] p-2.5 rounded-xl border border-slate-200">
              <span className="text-[#64748B] block text-[10px] font-semibold">Surge Suppressed:</span>
              <strong className="text-[#087EA4] text-sm font-extrabold">{softStart.peak_inrush_prevented_kw} kW</strong>
            </div>
            <div className="bg-[#F5FAFC] p-2.5 rounded-xl border border-slate-200">
              <span className="text-[#64748B] block text-[10px] font-semibold">Motor Wear Saved:</span>
              <strong className="text-[#10B981] text-sm font-extrabold">+{softStart.motor_wear_reduction_pct}% Lifespan</strong>
            </div>
          </div>
        </div>

        {/* Thermal Pre-Cooling Rig Card */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-5 shadow-card-float flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-2">
                <span className="text-base">❄️</span> Cold Storage Thermal Pre-Cooling
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                thermalPrecool.enabled
                  ? 'bg-[#E0F7FA] text-[#00B8D9] border-[#00B8D9]/40'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {thermalPrecool.enabled ? 'Pre-Cooling Active' : 'Standard Target'}
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-4 leading-relaxed font-medium">
              Excess midday solar power is converted into thermal storage by pre-cooling cold rooms from 4.0°C to 1.5°C. Acts as a zero-cost thermal battery during grid outages.
            </p>

            {/* Thermal Buffer Visual */}
            <div className="space-y-3 bg-[#EFFBFC] p-3.5 rounded-xl border border-[#00B8D9]/20 mb-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#64748B] font-medium">Cold Room Target Temp:</span>
                <span className="font-extrabold text-[#087EA4]">{thermalPrecool.cold_storage_precooled_temp_c}°C</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#64748B] font-medium">Stored Thermal Buffer:</span>
                <span className="font-extrabold text-[#10B981]">{thermalPrecool.thermal_energy_stored_kwh} kWh</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#64748B] font-medium">Safe Compressor Off-Time:</span>
                <span className="font-extrabold text-[#00B8D9]">{thermalPrecool.compressor_safe_off_duration_hours} Hours</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            <div className="bg-[#F5FAFC] p-2.5 rounded-xl border border-slate-200">
              <span className="text-[#64748B] block text-[10px] font-semibold">Solar Surplus Used:</span>
              <strong className="text-[#087EA4] text-sm font-extrabold">{thermalPrecool.solar_surplus_utilized_kw} kW</strong>
            </div>
            <div className="bg-[#F5FAFC] p-2.5 rounded-xl border border-slate-200">
              <span className="text-[#64748B] block text-[10px] font-semibold">Crop Spoilage Risk:</span>
              <strong className="text-[#10B981] text-sm font-extrabold">0.0% (Zero Spoilage)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
