import React, { useState } from 'react';
import { ActionPlan } from '../../types';
import { SafetyMatrixModal } from './SafetyMatrixModal';

interface Stage5SafetyProps {
  plan: ActionPlan | null;
  onNext: () => void;
  onBack: () => void;
}

export const Stage5Safety: React.FC<Stage5SafetyProps> = ({ plan, onNext, onBack }) => {
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);
  const [expandedIntervention, setExpandedIntervention] = useState<string | null>(null);

  if (!plan) return null;

  const interventions = plan.safety_interventions || [];
  const isHighRisk = plan.requires_human_approval || plan.risk_score >= 40;

  return (
    <div className="space-y-3">
      {/* Question 4 Anchor: IS IT SAFE? */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 4 of 5: Is It Safe? (Deterministic Safety Gate)
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          Deterministic rules enforce hard boundaries — AI cannot bypass safety constraints
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              05
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              Safety & Policy Engine Gate
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
              isHighRisk
                ? 'bg-rose-50 text-[#EF4444] border-rose-200'
                : 'bg-emerald-50 text-[#10B981] border-emerald-200'
            }`}>
              {isHighRisk ? '⚠️ High Risk Policy Clamp Active' : '✓ All Policies Cleared'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            AgentShield-inspired deterministic verification ensuring no unsafe command reaches the physical equipment or digital twin.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setMatrixModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#EFFBFC] border border-[#00B8D9]/30 text-[#087EA4] hover:bg-[#E0F7FA] text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>🛡️ View 9-Policy Matrix</span>
          </button>
          <button
            onClick={onNext}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-[#00B8D9] to-[#087EA4] hover:brightness-105 text-white text-xs font-extrabold rounded-xl shadow-glow-aqua transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <span>Operator Approval</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* CORE SAFETY PRINCIPLE: AI RECOMMENDS vs. SAFETY ENGINE ENFORCES */}
      <div className="bg-gradient-to-r from-[#031D2E] via-[#063B5C] to-[#087EA4] text-white rounded-2xl p-4 shadow-card-float space-y-2.5">
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="font-extrabold text-xs uppercase tracking-wider">
              Deterministic Governance Boundary: AI "Recommends" vs. Safety Engine "Enforces"
            </span>
          </div>
          <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-cyan-200">
            Hard Interlock
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <div className="text-[9px] font-bold text-cyan-200 uppercase tracking-wide mb-1">
              AI / AGENT RECOMMENDATION
            </div>
            <div className="font-medium text-white mb-1">
              → Pause flexible loads during deficit
            </div>
            <div className="text-[10px] text-[#36D7E8] font-bold pt-1 border-t border-white/10 flex items-center gap-1">
              <span>SAFETY ENGINE:</span>
              <span className="text-[#10B981]">Validated ✓</span>
            </div>
          </div>

          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <div className="text-[9px] font-bold text-cyan-200 uppercase tracking-wide mb-1">
              AI / AGENT RECOMMENDATION
            </div>
            <div className="font-medium text-white mb-1">
              → Start aerator motors for pond oxygen
            </div>
            <div className="text-[10px] text-[#36D7E8] font-bold pt-1 border-t border-white/10 flex items-center gap-1">
              <span>SAFETY ENGINE:</span>
              <span className="text-[#10B981]">Enforces VFD 120s Ramp (Clamped to 1.2x) ✓</span>
            </div>
          </div>

          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <div className="text-[9px] font-bold text-cyan-200 uppercase tracking-wide mb-1">
              AI / AGENT RECOMMENDATION
            </div>
            <div className="font-medium text-white mb-1">
              → Execute rebalancing autonomously
            </div>
            <div className="text-[10px] font-bold pt-1 border-t border-white/10 flex items-center gap-1">
              <span className="text-[#36D7E8]">SAFETY ENGINE:</span>
              <span className={isHighRisk ? 'text-[#EF4444]' : 'text-[#10B981]'}>
                {isHighRisk ? 'BLOCKED: High Risk Requires Operator Approval 👤' : 'APPROVED: Auto-Safe Permitted ✓'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Score & Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Risk Score</span>
          <span className={`text-lg font-extrabold ${isHighRisk ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {plan.risk_score} / 100
          </span>
          <span className="text-[9px] text-[#64748B] block mt-0.5 font-medium">
            {isHighRisk ? 'Operator Approval Mandatory' : 'Safe for Auto-Execution'}
          </span>
        </div>

        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Policies Evaluated</span>
          <span className="text-lg font-extrabold text-[#063B5C]">
            9 of 9 Verified
          </span>
          <span className="text-[9px] text-[#10B981] block mt-0.5 font-bold">
            Deterministic Engine Active
          </span>
        </div>

        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Soft-Start Inrush Clamp</span>
          <span className="text-lg font-extrabold text-[#087EA4]">
            {plan.soft_start_rig.peak_inrush_prevented_kw} kW Shaved
          </span>
          <span className="text-[9px] text-[#087EA4] block mt-0.5 font-semibold">
            VFD 120s Ramp Enforced
          </span>
        </div>

        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Battery Reserve Enforced</span>
          <span className="text-lg font-extrabold text-purple-700">
            ≥ 20.0% Hard Floor
          </span>
          <span className="text-[9px] text-purple-600 block mt-0.5 font-semibold">
            Policy 3 Deep Discharge Guard
          </span>
        </div>
      </div>

      {/* Active Interventions List */}
      <div className="space-y-2">
        <div className="text-[11px] font-extrabold text-[#063B5C] uppercase tracking-wider px-1">
          Active Safety Policy Checks ({interventions.length} Enforcements)
        </div>

        {interventions.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <span className="text-xl block mb-0.5">✓</span>
            <div className="text-xs font-extrabold text-emerald-900">
              All Operational Parameters Within Normal Safe Envelope
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5 max-w-xl mx-auto font-medium">
              No safety violations detected. The proposed action plan passed all 9 deterministic safety checks without requiring overrides.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {interventions.map((item, idx) => {
              const isExpanded = expandedIntervention === item.policy_id;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#00B8D9]/20 p-3.5 shadow-xs hover:shadow-card-float transition duration-150"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-extrabold bg-[#EFFBFC] text-[#087EA4] border border-[#00B8D9]/30">
                        {item.policy_id}
                      </span>
                      <h3 className="text-xs font-extrabold text-[#063B5C]">
                        {item.policy_name}
                      </h3>
                    </div>
                    <span className="text-[9px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ {item.protection_message}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200">
                      <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#EF4444] mb-0.5">
                        ⚠️ Why Proposed Action Was Unsafe:
                      </div>
                      <p className="text-rose-900 font-medium leading-relaxed text-[11px]">
                        {item.risk_reason}
                      </p>
                    </div>

                    <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
                      <div className="text-[8px] font-extrabold uppercase tracking-wider text-[#10B981] mb-0.5">
                        ✓ Deterministic Safe Replacement:
                      </div>
                      <p className="text-emerald-950 font-bold leading-relaxed text-[11px]">
                        {item.safe_replacement}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedIntervention(isExpanded ? null : item.policy_id)}
                      className="text-[10px] font-bold text-[#087EA4] hover:text-[#0096B3] flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide technical rule detail' : 'Show technical rule detail'}</span>
                      <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    <span className="text-[9px] text-[#64748B] font-mono">
                      Deterministic Policy Gate: ENFORCED
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-2.5 bg-[#031D2E] text-white rounded-xl text-xs font-mono">
                      <div className="text-[#36D7E8] font-bold text-[10px] mb-1">Rule Implementation:</div>
                      <div className="text-cyan-100/90 leading-relaxed text-[11px]">
                        {item.safe_replacement_detail}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-[#64748B] hover:text-[#063B5C] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Action Plan</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>Proceed to Human-in-the-Loop Approval</span>
          <span>→</span>
        </button>
      </div>

      <SafetyMatrixModal
        isOpen={matrixModalOpen}
        onClose={() => setMatrixModalOpen(false)}
      />
    </div>
  );
};
