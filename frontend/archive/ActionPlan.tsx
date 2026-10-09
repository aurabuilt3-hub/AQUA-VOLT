import React, { useState } from 'react';
import { ActionPlan as ActionPlanType } from '../types';

interface ActionPlanProps {
  plan: ActionPlanType | null;
}

export const ActionPlan: React.FC<ActionPlanProps> = ({ plan }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);

  if (!plan) return null;

  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 sm:p-6 shadow-card-float">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              4
            </span>
            <h2 className="text-xl font-extrabold text-[#063B5C]">What Does AquaVolt Recommend?</h2>
            {plan.ai_used ? (
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/40 flex items-center gap-1 shadow-xs">
                ⚡ Gemini 2.5 Flash AI Gateway
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#10B981] border border-emerald-200 flex items-center gap-1 shadow-xs" title={plan.ai_fallback_reason || '100% Deterministic Engine'}>
                🛡️ Safe Optimization Mode (Deterministic)
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] pl-9 mt-1 font-medium">
            AquaVolt protects life-critical pond oxygen & cold storage first, shedding flexible loads during energy deficit.
          </p>
        </div>

        <button
          onClick={() => setShowWhyModal(true)}
          className="px-4 py-2 bg-[#EFFBFC] border border-[#00B8D9]/30 text-[#087EA4] hover:bg-[#E0F7FA] rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
        >
          💡 Why did AquaVolt decide this?
        </button>
      </div>

      {/* 3-COLUMN MAIN ACTION PLAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* COLUMN 1: KEEP RUNNING (Critical Loads) */}
        <div className="bg-[#E0F7FA]/70 border border-[#14B8A6]/30 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-card-float transition">
          <div>
            <div className="flex items-center justify-between border-b border-[#14B8A6]/30 pb-2.5 mb-3.5">
              <h3 className="text-xs font-extrabold text-[#056282] uppercase tracking-wider flex items-center gap-1.5">
                <span>🟢</span> KEEP RUNNING (Critical Loads)
              </h3>
              <span className="text-[10px] font-extrabold bg-[#14B8A6] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Protected
              </span>
            </div>
            <ul className="space-y-2.5 text-xs font-bold text-[#063B5C]">
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#14B8A6]/20">
                <span className="text-[#10B981] font-extrabold text-base">✓</span>
                <div>
                  <div>Pond Aerators (Soft-Start)</div>
                  <div className="text-[10px] text-[#64748B] font-medium">VFD Ramp Active · 6.4 kW</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#14B8A6]/20">
                <span className="text-[#10B981] font-extrabold text-base">✓</span>
                <div>
                  <div>Cold Storage Refrigeration</div>
                  <div className="text-[10px] text-[#64748B] font-medium">Product Temperature Safe · 3.8°C</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#14B8A6]/20">
                <span className="text-[#10B981] font-extrabold text-base">✓</span>
                <div>
                  <div>Water Circulation Pumps</div>
                  <div className="text-[10px] text-[#64748B] font-medium">Essential Circulation · 2.1 kW</div>
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#14B8A6]/20 text-[10px] text-[#056282] font-extrabold uppercase tracking-wide">
            Life-critical & product safety prioritized
          </div>
        </div>

        {/* COLUMN 2: DEFER / REDUCE (Flexible Loads) */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-card-float transition">
          <div>
            <div className="flex items-center justify-between border-b border-amber-200 pb-2.5 mb-3.5">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🟠</span> DEFER / REDUCE (Flexible Loads)
              </h3>
              <span className="text-[10px] font-extrabold bg-[#F59E0B] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Shed / Paused
              </span>
            </div>
            <ul className="space-y-2.5 text-xs font-bold text-[#17324D]">
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[#F59E0B] font-extrabold text-base">→</span>
                <div>
                  <div>Ice Production Plant</div>
                  <div className="text-[10px] text-amber-700 font-medium">Paused 45 min · Saves 3.0 kW</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[#F59E0B] font-extrabold text-base">→</span>
                <div>
                  <div>Shrimp Processing Line</div>
                  <div className="text-[10px] text-amber-700 font-medium">Paused · Saves 4.0 kW</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[#F59E0B] font-extrabold text-base">→</span>
                <div>
                  <div>Non-essential Aux Lighting</div>
                  <div className="text-[10px] text-amber-700 font-medium">Reduced 50% · Saves 0.4 kW</div>
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 text-[10px] text-amber-900 font-extrabold uppercase tracking-wide">
            Shedding 7.4 kW to save 20% battery floor
          </div>
        </div>

        {/* COLUMN 3: ENERGY STRATEGY */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/30 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-card-float transition">
          <div>
            <div className="flex items-center justify-between border-b border-[#00B8D9]/30 pb-2.5 mb-3.5">
              <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> ENERGY STRATEGY
              </h3>
              <span className="text-[10px] font-extrabold bg-[#087EA4] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Supply Strategy
              </span>
            </div>
            <ul className="space-y-2.5 text-xs font-bold text-[#063B5C]">
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#00B8D9]/20">
                <span className="text-[#087EA4] font-extrabold text-base">☀️</span>
                <div>
                  <div>Use Solar Generation</div>
                  <div className="text-[10px] text-[#64748B] font-medium">Directing available PV output first</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#00B8D9]/20">
                <span className="text-[#10B981] font-extrabold text-base">🔋</span>
                <div>
                  <div>Maintain 20% Battery Floor</div>
                  <div className="text-[10px] text-[#64748B] font-medium">Reserve floor protected from depletion</div>
                </div>
              </li>
              <li className="flex items-center gap-2.5 bg-white/80 p-2.5 rounded-xl border border-[#00B8D9]/20">
                <span className="text-[#00B8D9] font-extrabold text-base">⚡</span>
                <div>
                  <div>Grid Standby / Island Mode</div>
                  <div className="text-[10px] text-[#64748B] font-medium">Microgrid ready for grid outages</div>
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#00B8D9]/20 text-[10px] text-[#087EA4] font-extrabold uppercase tracking-wide">
            Renewable Solar & Battery Reserve Prioritized
          </div>
        </div>
      </div>

      {/* DEDICATED THERMAL & AERATOR STRATEGY ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thermal Strategy Card */}
        <div className="bg-[#E0F7FA]/50 border border-[#00B8D9]/20 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-1.5">
                <span>❄️</span> Thermal Strategy
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00B8D9]/20 text-[#087EA4] border border-[#00B8D9]/30">
                {plan.thermal_precool_rig.enabled ? 'Pre-Cooling Active (1.5°C)' : 'Standard 4.0°C Target'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-medium mb-3">
              {plan.thermal_precool_rig.enabled
                ? 'Solar Surplus Active: Pre-cooling cold room to 1.5°C to store 6.8 kWh thermal buffer.'
                : 'Cold Buffer Active: Utilizing cold mass buffer to hold safe 2.0–5.0°C range without drawing power.'}
            </p>
            {/* Visual Timeline */}
            <div className="flex items-center justify-between text-[9px] font-extrabold text-[#087EA4] bg-white p-2 rounded-xl border border-[#00B8D9]/20">
              <span>Solar Available</span>
              <span>→</span>
              <span>Pre-Cool (1.5°C)</span>
              <span>→</span>
              <span>Solar Drops</span>
              <span>→</span>
              <span>Use Buffer (4.2h)</span>
            </div>
          </div>
        </div>

        {/* Aerator Strategy Card */}
        <div className="bg-emerald-50/50 border border-[#14B8A6]/20 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-1.5">
                <span>🌀</span> Aerator Strategy
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#14B8A6]/20 text-[#10B981] border border-[#14B8A6]/30">
                Soft-Start VFD
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-medium mb-3">
              {plan.soft_start_rig.enabled
                ? 'Soft-Start Rig Active: Ramping motor frequency over 120s to clamp starting inrush surge.'
                : 'Aerators operating in staggered mode to prevent inverter trip.'}
            </p>
            {/* Visual Timeline */}
            <div className="flex items-center justify-between text-[9px] font-extrabold text-[#10B981] bg-white p-2 rounded-xl border border-[#14B8A6]/20">
              <span>Start Request</span>
              <span>→</span>
              <span>Energy Check</span>
              <span>→</span>
              <span>Soft Start (0-50Hz)</span>
              <span>→</span>
              <span>Ramp (120s)</span>
              <span>→</span>
              <span>Stable (6.4kW)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 bg-[#031D2E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#00B8D9]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <h3 className="text-base font-extrabold text-[#063B5C]">Why Did AquaVolt Decide This?</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#17324D] leading-relaxed">
              <div className="bg-[#EFFBFC] border border-[#00B8D9]/30 p-4 rounded-2xl font-medium text-[#063B5C]">
                {plan.orchestrator_summary}
              </div>

              <div className="space-y-2 pt-1">
                <h4 className="font-extrabold text-[#063B5C] uppercase tracking-wider text-[11px]">Core Operational Principles Applied:</h4>
                <ul className="space-y-2 text-[#64748B]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#10B981] font-bold">1.</span>
                    <span><b>Life-Critical Aeration First</b>: Shrimp require minimum 4.0 mg/L Dissolved Oxygen. Aerator motors are never shed.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10B981] font-bold">2.</span>
                    <span><b>Cold Storage Protection</b>: Product temperature must stay between 2.0°C and 5.0°C to prevent spoilage of harvested stock.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10B981] font-bold">3.</span>
                    <span><b>Battery Reserve Floor</b>: The battery is never discharged below 20.0% SOC to preserve hardware lifespan and emergency reserve.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#10B981] font-bold">4.</span>
                    <span><b>Flexible Load Shedding</b>: Ice production and shrimp processing lines are non-critical and deferred during energy constraints.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#00B8D9] to-[#087EA4] hover:brightness-105 text-white font-extrabold rounded-xl text-xs transition shadow-glow-aqua"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
