import React, { useState } from 'react';
import { ActionPlan } from '../../types';
import { WhyDecisionModal } from './WhyDecisionModal';

interface Stage4PlanProps {
  plan: ActionPlan | null;
  onNext: () => void;
  onBack: () => void;
}

export const Stage4Plan: React.FC<Stage4PlanProps> = ({ plan, onNext, onBack }) => {
  const [whyModalOpen, setWhyModalOpen] = useState(false);

  if (!plan) return null;

  return (
    <div className="space-y-3">
      {/* Question 3 Continuation: WHAT DID AQUAVOLT DECIDE? */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 3 of 5: What Did AquaVolt Decide? (Synthesized Plan)
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          Orchestrated action plan generated from combined specialist-agent findings
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              04
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              Synthesized Operational Action Plan
            </h2>
            {plan.ai_used ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/40 flex items-center gap-1 shadow-xs">
                ⚡ Gemini 2.5 Flash AI Gateway
              </span>
            ) : (
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#10B981] border border-emerald-200 flex items-center gap-1 shadow-xs"
                title={plan.ai_fallback_reason || 'Deterministic Safe Optimization'}
              >
                🛡️ Safe Optimization Mode (Deterministic)
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Life-critical pond oxygen and cold storage protected first; flexible loads scheduled dynamically.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setWhyModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#EFFBFC] border border-[#00B8D9]/30 text-[#087EA4] hover:bg-[#E0F7FA] text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>💡 Why this decision?</span>
          </button>
          <button
            onClick={onNext}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-[#00B8D9] to-[#087EA4] hover:brightness-105 text-white text-xs font-extrabold rounded-xl shadow-glow-aqua transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <span>Run Safety Gate</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Prominent Provenance Badge */}
      <div className="bg-[#EFFBFC] border border-[#00B8D9]/30 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
        <span className="text-[#087EA4] font-extrabold">
          ✓ Generated from combined specialist-agent findings.
        </span>
        <span className="text-[#64748B] font-mono text-[10px]">
          Target: Hatchery Microgrid PS04
        </span>
      </div>

      {/* 3-Column Structured Action Plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* COLUMN 1: PROTECT */}
        <div className="bg-[#E0F7FA]/70 border border-[#14B8A6]/40 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-card-float transition">
          <div>
            <div className="flex items-center justify-between border-b border-[#14B8A6]/30 pb-2 mb-2.5">
              <h3 className="text-xs font-extrabold text-[#056282] uppercase tracking-wider flex items-center gap-1.5">
                <span>🟢</span> PROTECT (Critical Loads)
              </h3>
              <span className="text-[9px] font-extrabold bg-[#14B8A6] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Protected
              </span>
            </div>

            <ul className="space-y-2 text-xs font-bold text-[#063B5C]">
              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-[#14B8A6]/20">
                <span className="text-[#10B981] font-extrabold text-sm mt-0.5">✓</span>
                <div>
                  <div className="text-xs font-extrabold">Pond Aerators</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    VFD Frequency Soft-Start · 6.4 kW Peak Clamped
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-[#14B8A6]/20">
                <span className="text-[#10B981] font-extrabold text-sm mt-0.5">✓</span>
                <div>
                  <div className="text-xs font-extrabold">Cold Storage</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Product Temp Safe · {plan.thermal_precool_rig.cold_storage_precooled_temp_c}°C Buffer Hold
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-[#14B8A6]/20">
                <span className="text-[#10B981] font-extrabold text-sm mt-0.5">✓</span>
                <div>
                  <div className="text-xs font-extrabold">Water Circulation</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Pumps active · Essential water exchange
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-3 pt-2 border-t border-[#14B8A6]/20 text-[10px] text-[#056282] font-extrabold uppercase tracking-wide">
            Biomass Survival: 100% Protected
          </div>
        </div>

        {/* COLUMN 2: DEFER */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-card-float transition">
          <div>
            <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2.5">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🟠</span> DEFER (Flexible Loads)
              </h3>
              <span className="text-[9px] font-extrabold bg-[#F59E0B] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Shed -7.0 kW
              </span>
            </div>

            <ul className="space-y-2 text-xs font-bold text-[#17324D]">
              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[#F59E0B] font-extrabold text-sm mt-0.5">→</span>
                <div>
                  <div className="text-xs font-extrabold">Ice Production</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Paused · 3.0 kW shifted off peak deficit
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[#F59E0B] font-extrabold text-sm mt-0.5">→</span>
                <div>
                  <div className="text-xs font-extrabold">Processing</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Paused · 4.0 kW deferred until solar recovery
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[#F59E0B] font-extrabold text-sm mt-0.5">→</span>
                <div>
                  <div className="text-xs font-extrabold">Non-essential Loads</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Auxiliary lighting dimmed to safety baseline
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-3 pt-2 border-t border-amber-200 text-[10px] text-amber-900 font-extrabold uppercase tracking-wide">
            Protects Microgrid Stability
          </div>
        </div>

        {/* COLUMN 3: ENERGY STRATEGY */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/30 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-card-float transition">
          <div>
            <div className="flex items-center justify-between border-b border-[#00B8D9]/20 pb-2 mb-2.5">
              <h3 className="text-xs font-extrabold text-[#087EA4] uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> ENERGY STRATEGY
              </h3>
              <span className="text-[9px] font-extrabold bg-[#087EA4] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Microgrid
              </span>
            </div>

            <ul className="space-y-2 text-xs font-bold text-[#063B5C]">
              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-[#00B8D9]/20">
                <span className="text-[#087EA4] font-extrabold text-sm mt-0.5">→</span>
                <div>
                  <div className="text-xs font-extrabold">Solar First</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    100% available renewable energy used first
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-[#00B8D9]/20">
                <span className="text-[#087EA4] font-extrabold text-sm mt-0.5">→</span>
                <div>
                  <div className="text-xs font-extrabold">Maintain 20% Battery Reserve</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Policy 3 enforced: deep discharge prevented
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/90 p-2.5 rounded-xl border border-[#00B8D9]/20">
                <span className="text-[#087EA4] font-extrabold text-sm mt-0.5">→</span>
                <div>
                  <div className="text-xs font-extrabold">Preserve Critical Loads</div>
                  <div className="text-[10px] text-[#64748B] font-medium">
                    Zero diesel run · Avoids ₹9.50/kWh peak tariff
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-3 pt-2 border-t border-[#00B8D9]/20 text-[10px] text-[#087EA4] font-extrabold uppercase tracking-wide">
            Optimized Power Balancing
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-[#64748B] hover:text-[#063B5C] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Orchestration</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>Proceed to Safety Policy Gate</span>
          <span>→</span>
        </button>
      </div>

      <WhyDecisionModal
        isOpen={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
        plan={plan}
      />
    </div>
  );
};
