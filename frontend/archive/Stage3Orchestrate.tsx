import React from 'react';
import { ActionPlan } from '../../types';

interface Stage3OrchestrateProps {
  plan: ActionPlan | null;
  onNext: () => void;
  onBack: () => void;
}

export const Stage3Orchestrate: React.FC<Stage3OrchestrateProps> = ({
  plan,
  onNext,
  onBack,
}) => {
  if (!plan) return null;

  return (
    <div className="space-y-3">
      {/* Question 3 Anchor: WHAT DID AQUAVOLT DECIDE? */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 3 of 5: What Did AquaVolt Decide? (Orchestrator Hub)
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          Priority synthesis resolves domain conflict between life safety and microgrid limits
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              03
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              AquaVolt Orchestrator Core
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00B8D9]/10 text-[#087EA4] border border-[#00B8D9]/30 uppercase tracking-wider">
              Central Intelligence Hub
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Aggregates independent specialist agent inputs to synthesize a single coordinated operational action plan.
          </p>
        </div>

        <button
          onClick={onNext}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#00B8D9] via-[#087EA4] to-[#063B5C] hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-glow-aqua flex items-center justify-center gap-2 transition uppercase tracking-wider shrink-0"
        >
          <span>View Action Plan</span>
          <span>→</span>
        </button>
      </div>

      {/* 3-Column Synthesis Pipeline */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Column 1: Incoming Agent Inputs (3.5 cols) */}
          <div className="lg:col-span-4 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>1. Agent Inputs Received</span>
              </div>

              <div className="space-y-1.5">
                <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>🐟</span>
                    <div>
                      <div className="font-extrabold text-[#063B5C]">Pond Agent</div>
                      <div className="text-[10px] text-[#64748B]">Demand: Continuous Aerator O₂</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-[#10B981] border border-emerald-300">
                    LIFE-SAFETY
                  </span>
                </div>

                <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    <div>
                      <div className="font-extrabold text-[#063B5C]">Energy Agent</div>
                      <div className="text-[10px] text-[#64748B]">Demand: ≥20% Reserve Floor</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-300">
                    MICROGRID
                  </span>
                </div>

                <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>❄️</span>
                    <div>
                      <div className="font-extrabold text-[#063B5C]">Cold-Chain Agent</div>
                      <div className="text-[10px] text-[#64748B]">Demand: Thermal Hold Buffer</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-100 text-[#0096B3] border border-cyan-300">
                    ASSET HOLD
                  </span>
                </div>

                <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>🛡️</span>
                    <div>
                      <div className="font-extrabold text-[#063B5C]">Risk Agent</div>
                      <div className="text-[10px] text-[#64748B]">Demand: Clamp Inrush Surge</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-[#EF4444] border border-rose-300">
                    POLICY GATE
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#087EA4] font-semibold bg-[#E0F7FA] p-2 rounded-xl border border-[#00B8D9]/30 text-center">
              All 4 agents evaluate same canonical telemetry
            </div>
          </div>

          {/* Column 2: Orchestration Intelligence Engine (4.5 cols) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#063B5C] via-[#087EA4] to-[#031D2E] text-white p-4 rounded-2xl shadow-glow-aqua flex flex-col justify-between my-1 lg:my-0">
            <div>
              <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2.5">
                <span className="text-[10px] font-mono font-extrabold text-[#36D7E8] uppercase tracking-wider">
                  2. AQUAVOLT ORCHESTRATOR
                </span>
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              </div>

              {/* The exact requested 5-step pipeline */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span>Context Aggregation</span>
                  <span className="text-[#36D7E8] font-bold">✓</span>
                </div>
                <div className="text-center text-cyan-200/50 text-[10px] leading-none">↓</div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span>Priority Evaluation</span>
                  <span className="text-[#36D7E8] font-bold">✓</span>
                </div>
                <div className="text-center text-cyan-200/50 text-[10px] leading-none">↓</div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span>Conflict Resolution</span>
                  <span className="text-[#36D7E8] font-bold">✓</span>
                </div>
                <div className="text-center text-cyan-200/50 text-[10px] leading-none">↓</div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 flex items-center justify-between">
                  <span>Energy Allocation</span>
                  <span className="text-[#36D7E8] font-bold">✓</span>
                </div>
                <div className="text-center text-cyan-200/50 text-[10px] leading-none">↓</div>
                <div className="bg-[#00B8D9]/20 px-2.5 py-1.5 rounded-lg border border-[#36D7E8]/40 flex items-center justify-between text-[#36D7E8] font-bold">
                  <span>Unified Operational Plan</span>
                  <span className="text-[#10B981]">✓</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] font-extrabold text-[#36D7E8]">
              <span>Status:</span>
              <span className="bg-[#10B981]/20 text-[#36D7E8] px-2 py-0.5 rounded border border-[#36D7E8]/40">
                ORCHESTRATION COMPLETE ✓
              </span>
            </div>
          </div>

          {/* Column 3: Resulting Allocation Directives (4 cols) */}
          <div className="lg:col-span-4 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-2">
                3. Unified Plan Formulated
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-emerald-900 text-xs">🟢 PROTECT</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded">6.4 kW</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Pond aerators (VFD soft-start clamped) + cold storage.
                  </p>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-amber-900 text-xs">🟠 DEFER</span>
                    <span className="text-[9px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded">-7.0 kW</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Ice plant & processing line paused during generation deficit.
                  </p>
                </div>

                <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-[#087EA4] text-xs">⚡ ENERGY</span>
                    <span className="text-[9px] font-bold text-[#087EA4] bg-white px-2 py-0.5 rounded">≥20% Floor</span>
                  </div>
                  <p className="text-[11px] text-[#17324D] leading-snug">
                    Solar prioritized; BESS reserve floor locked; zero diesel burn.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-center">
              Life-Safety &gt; Asset Protection &gt; Economy
            </div>
          </div>
        </div>
      </div>

      {/* Short Plain-English Rationale */}
      <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">💡</span>
          <h4 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider">
            Orchestrator Plain-English Rationale:
          </h4>
        </div>
        <p className="text-xs text-[#17324D] leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
          "{plan.orchestrator_summary ||
            'Energy is constrained. Pond aeration and cold storage are life/product-critical, while ice production and processing can be deferred.'}"
        </p>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-[#64748B] hover:text-[#063B5C] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Specialist Agents</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>View Decision Plan</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
