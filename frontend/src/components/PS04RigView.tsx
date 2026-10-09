import React from 'react';
import { ActionPlan, IoTTelemetry } from '../types';
import { PS04DigitalTwin } from './PS04DigitalTwin';

interface PS04RigViewProps {
  plan: ActionPlan | null;
  telemetry: IoTTelemetry | null;
  twinState?: any;
  analysis?: any;
  executionResult?: any;
  decisionState?: 'pending' | 'approved' | 'modified' | 'rejected';
}

export const PS04RigView: React.FC<PS04RigViewProps> = ({
  plan,
  telemetry,
  twinState,
  analysis,
  executionResult,
  decisionState = 'pending',
}) => {
  const isExecuted = executionResult?.status === 'SUCCESS' && (decisionState === 'approved' || decisionState === 'modified');
  const isRejected = decisionState === 'rejected';

  const solarKw = twinState?.microgrid?.solar_kw ?? telemetry?.solar_gen_kw ?? 14.1;
  const batterySoc = twinState?.microgrid?.battery_soc_pct ?? telemetry?.battery_soc_pct ?? 48;
  const coldTemp = twinState?.cold_storage_rig?.current_temp_c ?? telemetry?.cold_room_temp_c ?? 4.1;
  const targetMin = 2.0;
  const targetMax = 5.0;
  const thermalBufferHours = telemetry?.thermal_buffer_hours ?? 3.5;
  const precoolActive = isExecuted
    ? (twinState?.cold_storage_rig?.precooled_active ?? telemetry?.thermal_precooling_active ?? (solarKw > 14.0))
    : false;
  
  const aeratorsRunning = isRejected
    ? (telemetry?.aerators_running ?? 2)
    : (twinState?.aerator_rig?.running_aerators ?? telemetry?.aerators_running ?? 4);
  const aeratorsTotal = telemetry?.aerators_total ?? 4;
  const softStartActive = isRejected ? false : (plan?.soft_start_rig.enabled ?? true);
  const inrushClampedKw = plan?.soft_start_rig.peak_inrush_prevented_kw ?? 12.1;
  const currentStep = isRejected
    ? "Actuation Cancelled — No VFD Ramping"
    : (twinState?.aerator_rig?.status_text ?? plan?.soft_start_rig.current_step ?? "VFD Frequency Ramping (0 → 50 Hz)");
  
  const totalLoadKw = twinState?.microgrid?.total_load_kw ?? ((aeratorsRunning * 1.6) + 3.2 + (telemetry?.pumps_kw ?? 2.1) + (telemetry?.ice_plant_kw ?? 3.0));

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto animate-fadeIn pb-8">
      {/* Enterprise Digital Twin Header */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Microgrid Digital Twin Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital Twin · Simulated equipment · No physical hardware connected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isExecuted
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : isRejected
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isExecuted
              ? 'Modeled Post-Execution State'
              : isRejected
              ? 'Execution Blocked (State Unchanged)'
              : 'Pre-Execution Baseline State'}
          </span>
        </div>
      </div>

      {/* State Disclosure Alert Banner */}
      {isRejected ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">🛑</span>
            <span>
              <strong>Operator Rejection Enforced:</strong> Zero commands dispatched to Tool Gateway. Digital Twin equipment reflects unchanged pre-incident state.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
            0 Commands
          </span>
        </div>
      ) : isExecuted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">✓</span>
            <span>
              <strong>Simulated Dispatch Confirmed:</strong> Operator-approved plan dispatched through Tool Gateway. Digital Twin reflects modeled post-execution state.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
            {executionResult?.actions_executed ?? 1} Simulated Actions
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">ℹ️</span>
            <span>
              <strong>Pre-Execution Baseline:</strong> Telemetry model reflects current scenario conditions. Simulated execution occurs when an action plan is approved on the Governance screen.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
            Awaiting Approval
          </span>
        </div>
      )}

      {/* Interactive Digital Twin Visualizer Component */}
      <PS04DigitalTwin softStart={plan?.soft_start_rig} thermalPrecool={plan?.thermal_precool_rig} telemetry={telemetry} twinState={twinState} />

      {/* Area 1: THERMAL PRE-COOLING */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-2">
          <div>
            <h3 className="text-sm font-bold text-command-900 flex items-center gap-2 font-mono uppercase tracking-wide">
              <span>❄️</span> 1. Thermal Pre-Cooling System
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Utilizes harvested shrimp thermal mass as a thermal energy storage battery during solar surplus.
            </p>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-mono font-semibold border ${
            precoolActive
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {precoolActive ? 'ACTIVE · Pre-Cooling to 1.5°C' : 'STANDBY · Standard 4.0°C Mode'}
          </span>
        </div>

        {/* 6 Cold Storage Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Cold Room Temp</div>
            <div className={`text-xl font-mono font-bold mt-1 tabular-nums ${coldTemp > targetMax ? 'text-rose-600' : 'text-command-900'}`}>
              {coldTemp.toFixed(1)}°C
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Measured Sensor</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Target Range</div>
            <div className="text-xl font-mono font-bold text-emerald-700 mt-1 tabular-nums">{targetMin}°C – {targetMax}°C</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Safe Operating Window</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Thermal Buffer</div>
            <div className="text-xl font-mono font-bold text-command-800 mt-1 tabular-nums">{thermalBufferHours.toFixed(1)} h</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Safe Hold Duration</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Cooling State</div>
            <div className="text-sm font-bold text-command-900 mt-1.5 font-mono">
              {precoolActive ? 'Compressor 100%' : 'Standard Cycle'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Refrigeration Drive</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Pre-Cooling Mode</div>
            <div className={`text-sm font-bold mt-1.5 font-mono ${precoolActive ? 'text-sky-700' : 'text-slate-500'}`}>
              {precoolActive ? 'Engaged (1.5°C)' : 'Standby (4.0°C)'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Solar Thermal Sync</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Est. Thermal Energy</div>
            <div className="text-xl font-mono font-bold text-command-800 mt-1 tabular-nums">6.8 kWh</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Stored Thermal Buffer</div>
          </div>
        </div>

        {/* Thermal Pre-Cooling Sequence Timeline */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-command-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <span>🔄</span> Thermal Pre-Cooling Timeline Sequence
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-amber-700 text-[11px] mb-1 font-mono">1. Solar Surplus</div>
              <p className="text-[11px] text-slate-600">Solar generation exceeds 14.0 kW surplus.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-sky-700 text-[11px] mb-1 font-mono">2. Pre-Cooling</div>
              <p className="text-[11px] text-slate-600">Compressor chills cold room to 1.5°C floor.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-rose-700 text-[11px] mb-1 font-mono">3. Solar Drop</div>
              <p className="text-[11px] text-slate-600">Cloud cover or grid outage triggers deficit.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-command-800 text-[11px] mb-1 font-mono">4. Thermal Float</div>
              <p className="text-[11px] text-slate-600">Compressor pauses, protecting battery floor.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-emerald-700 text-[11px] mb-1 font-mono">5. Cold Hold</div>
              <p className="text-[11px] text-slate-600">Inventory safely floats within 2.0–5.0°C envelope.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Area 2: AERATOR SOFT-START */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-2">
          <div>
            <h3 className="text-sm font-bold text-command-900 flex items-center gap-2 font-mono uppercase tracking-wide">
              <span>🌀</span> 2. Aerator Soft-Start VFD Rig
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clamps 350% motor starting inrush current using VFD frequency ramping and staggered delays.
            </p>
          </div>
          <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {softStartActive ? 'VFD Soft-Start Active' : 'Staggered Direct Start'}
          </span>
        </div>

        {/* 6 Aerator Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Motor Status</div>
            <div className="text-xl font-mono font-bold text-emerald-700 mt-1 tabular-nums">{aeratorsRunning} / {aeratorsTotal}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Motors Running</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Start Request</div>
            <div className="text-sm font-bold text-command-900 mt-1.5 font-mono">
              {telemetry?.pond_dissolved_oxygen_mg_l && telemetry.pond_dissolved_oxygen_mg_l < 3.5 ? '+2 Motors Req' : 'Normal State'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">DO Threshold Trigger</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">DOL Inrush Spike</div>
            <div className="text-xl font-mono font-bold text-rose-600 mt-1 tabular-nums">18.5 kW</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Unclamped Surge</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">VFD Clamped Peak</div>
            <div className="text-xl font-mono font-bold text-command-900 mt-1 tabular-nums">6.4 kW</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Suppressed (-{inrushClampedKw.toFixed(1)} kW)</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Available Solar+Bat</div>
            <div className="text-xl font-mono font-bold text-command-800 mt-1 tabular-nums">{(solarKw + (batterySoc * 0.15)).toFixed(1)} kW</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Microgrid Capacity</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500 font-semibold">Battery SOC</div>
            <div className={`text-xl font-mono font-bold mt-1 tabular-nums ${batterySoc < 20 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {batterySoc.toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">20.0% Floor Reserve</div>
          </div>
        </div>

        {/* Aerator Soft-Start Sequence Flow */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-command-900 uppercase font-mono tracking-wider flex items-center gap-2">
              <span>🔄</span> Aerator Soft-Start Sequence Flow
            </h4>
            <span className="text-[10px] font-mono font-semibold bg-white text-command-800 px-2.5 py-0.5 rounded border border-slate-200">
              Current: {currentStep}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-amber-700 text-[11px] mb-1 font-mono">1. Start Request</div>
              <p className="text-[11px] text-slate-600">Pond DO or operator triggers aerator start.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-command-800 text-[11px] mb-1 font-mono">2. Energy Check</div>
              <p className="text-[11px] text-slate-600">Verifies solar output & 20% battery floor reserve.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-purple-700 text-[11px] mb-1 font-mono">3. Soft-Start</div>
              <p className="text-[11px] text-slate-600">VFD engages at 10 Hz minimum frequency.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-petrol-700 text-[11px] mb-1 font-mono">4. Ramp-Up</div>
              <p className="text-[11px] text-slate-600">Ramps 0 → 50 Hz over 120s with 30s delays.</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="font-bold text-emerald-700 text-[11px] mb-1 font-mono">5. Nominal Speed</div>
              <p className="text-[11px] text-slate-600">Motors reach nominal 50 Hz speed safely.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
