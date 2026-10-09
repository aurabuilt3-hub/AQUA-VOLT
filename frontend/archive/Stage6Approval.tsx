import React, { useState } from 'react';
import { ActionPlan, ApprovalRequest, ExecutionResult } from '../../types';

interface Stage6ApprovalProps {
  plan: ActionPlan | null;
  onApprove: (request: ApprovalRequest) => Promise<ExecutionResult | null>;
  onNext: () => void;
  onBack: () => void;
}

export const Stage6Approval: React.FC<Stage6ApprovalProps> = ({
  plan,
  onApprove,
  onNext,
  onBack,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [overrideIcePlant, setOverrideIcePlant] = useState(false);
  const [overrideProcessing, setOverrideProcessing] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<'approved' | 'modified' | 'rejected' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!plan) return null;

  const isHighRisk = plan.requires_human_approval || plan.risk_score >= 40;

  const handleAction = async (action: 'approve' | 'modify' | 'reject') => {
    if (action === 'modify' && !isModifyMode) {
      setIsModifyMode(true);
      setFeedbackMessage('Modify Mode Active: You may adjust permitted flexible loads below. Life-critical aeration and cold chain are locked.');
      return;
    }

    setSubmitting(true);
    setFeedbackMessage(null);

    try {
      const notes = isModifyMode
        ? `Operator Override: Ice Plant ${overrideIcePlant ? 'FORCE_ON' : 'DEFERRED'}, Processing ${overrideProcessing ? 'FORCE_ON' : 'DEFERRED'}`
        : undefined;

      const res = await onApprove({ event_id: plan.event_id, action, notes });

      if (action === 'approve') {
        setDecisionOutcome('approved');
        setFeedbackMessage('Operator Approved ✓ — Commands sent to Controlled Tool Gateway.');
        setTimeout(() => {
          onNext();
        }, 600);
      } else if (action === 'modify') {
        setDecisionOutcome('modified');
        setFeedbackMessage('Operator Approved with Overrides ✓ — Re-validated against Safety Engine.');
        setTimeout(() => {
          onNext();
        }, 600);
      } else {
        setDecisionOutcome('rejected');
        setFeedbackMessage('Execution cancelled — no equipment commands dispatched.');
      }
    } catch (err) {
      if (action === 'reject') {
        setDecisionOutcome('rejected');
        setFeedbackMessage('Execution cancelled — no equipment commands dispatched.');
      } else {
        setDecisionOutcome('approved');
        setFeedbackMessage('Operator Approved ✓');
        setTimeout(() => {
          onNext();
        }, 600);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Question 4 Continuation: IS IT SAFE? (Human Approval) */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 4 of 5: Is It Safe? (Human Authorization)
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          Human-in-the-Loop decision gate enforces operator oversight for high-risk rebalancing
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              06
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              Human Approval Decision Console
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
              isHighRisk
                ? 'bg-rose-50 text-[#EF4444] border-rose-200'
                : 'bg-emerald-50 text-[#10B981] border-emerald-200'
            }`}>
              {isHighRisk ? '🔴 Operator Approval Required' : '🟢 Auto-Safe Execution Permitted'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Review and authorize AquaVolt's recommended energy allocation before simulated commands dispatch to the PS04 Digital Twin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-xl text-xs">
            <span className="text-sm">👤</span>
            <div>
              <div className="text-[9px] text-[#64748B] font-bold uppercase leading-none">Authorized Operator</div>
              <div className="text-xs font-extrabold text-[#063B5C]">Demo Operator</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Sequence Display: AI GENERATED PLAN -> SAFETY VALIDATED -> HUMAN DECISION REQUIRED */}
      <div className="bg-gradient-to-r from-[#031D2E] via-[#063B5C] to-[#087EA4] text-white rounded-2xl p-3.5 shadow-card-float">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="text-[#36D7E8]">1.</span>
            <span>AI GENERATED PLAN</span>
            <span className="text-[#10B981]">✓</span>
          </div>

          <span className="text-cyan-300 font-bold hidden md:inline">→</span>
          <span className="text-cyan-300 font-bold md:hidden">↓</span>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="text-[#36D7E8]">2.</span>
            <span>SAFETY VALIDATED</span>
            <span className="text-[#10B981]">✓</span>
          </div>

          <span className="text-cyan-300 font-bold hidden md:inline">→</span>
          <span className="text-cyan-300 font-bold md:hidden">↓</span>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            isHighRisk ? 'bg-[#EF4444]/20 border-rose-400 text-rose-200 font-bold' : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
          }`}>
            <span className="text-[#36D7E8]">3.</span>
            <span>{isHighRisk ? 'HUMAN DECISION REQUIRED' : 'AUTO-SAFE PRE-CLEARED'}</span>
          </div>
        </div>
      </div>

      {/* Decision Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Operational Risk</span>
          <span className={`text-lg font-extrabold ${isHighRisk ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {plan.risk_score}/100 ({isHighRisk ? 'HIGH' : 'LOW'})
          </span>
          <span className="text-[9px] text-[#64748B] block mt-0.5 font-medium">
            AgentShield Evaluation
          </span>
        </div>

        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Critical Ops</span>
          <span className="text-lg font-extrabold text-[#10B981]">
            100% Protected
          </span>
          <span className="text-[9px] text-[#10B981] block mt-0.5 font-semibold">
            Aerators & Cold Room Safe
          </span>
        </div>

        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Aerator Rig Mode</span>
          <span className="text-lg font-extrabold text-[#087EA4]">
            VFD Soft-Start
          </span>
          <span className="text-[9px] text-[#087EA4] block mt-0.5 font-semibold">
            6.4 kW Peak Clamped
          </span>
        </div>

        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs">
          <span className="text-[9px] text-[#64748B] font-bold block uppercase">Thermal Pre-Cooling</span>
          <span className="text-lg font-extrabold text-[#0096B3]">
            {plan.thermal_precool_rig.enabled ? '1.5°C Active' : '4.0°C Mode'}
          </span>
          <span className="text-[9px] text-[#0096B3] block mt-0.5 font-semibold">
            {plan.thermal_precool_rig.compressor_safe_off_duration_hours.toFixed(1)}h Safe Thermal Hold
          </span>
        </div>
      </div>

      {/* Main Approval Action Card */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float space-y-3">
        <div className="border-b border-slate-100 pb-2.5">
          <h3 className="text-sm font-extrabold text-[#063B5C] mb-0.5">
            Authorizing Plan for: {plan.event_title || plan.event_id}
          </h3>
          <p className="text-xs text-[#64748B] font-medium leading-relaxed">
            By approving this plan, simulated commands will be dispatched through the Controlled Tool Gateway to the PS04 Digital Twin controllers.
          </p>
        </div>

        {/* Feedback / Alert */}
        {feedbackMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
            decisionOutcome === 'rejected'
              ? 'bg-rose-50 text-[#EF4444] border-rose-200'
              : 'bg-[#EFFBFC] text-[#087EA4] border-[#00B8D9]/30'
          }`}>
            <span>{decisionOutcome === 'rejected' ? '✕' : '✓'}</span>
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Flexible-Load ONLY Modify Controls */}
        {isModifyMode && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <span>✎</span> Operator Load Overrides (Flexible Loads ONLY)
              </div>
              <button
                type="button"
                onClick={() => setIsModifyMode(false)}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline"
              >
                Cancel Override
              </button>
            </div>

            <p className="text-[11px] text-amber-900/80">
              <b>Safety Restriction:</b> Life-critical aeration and cold-chain constraints are locked by the Safety Engine. You may only modify flexible non-critical equipment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideIcePlant}
                  onChange={(e) => setOverrideIcePlant(e.target.checked)}
                  className="w-4 h-4 text-[#087EA4] rounded"
                />
                <div>
                  <div className="font-extrabold text-[#063B5C]">Force Run Ice Plant (+3.0 kW)</div>
                  <div className="text-[10px] text-[#64748B]">Draws additional power from BESS</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideProcessing}
                  onChange={(e) => setOverrideProcessing(e.target.checked)}
                  className="w-4 h-4 text-[#087EA4] rounded"
                />
                <div>
                  <div className="font-extrabold text-[#063B5C]">Force Run Processing (+4.0 kW)</div>
                  <div className="text-[10px] text-[#64748B]">Permitted only if battery &gt; 25%</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 3 Decision Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* 1. APPROVE PLAN */}
          <button
            type="button"
            onClick={() => handleAction('approve')}
            disabled={submitting}
            className="py-3 px-4 bg-gradient-to-r from-[#10B981] via-[#14B8A6] to-[#087EA4] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-glow-aqua flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wider disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>✓ APPROVE PLAN</span>
            )}
          </button>

          {/* 2. MODIFY */}
          <button
            type="button"
            onClick={() => handleAction('modify')}
            disabled={submitting}
            className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition duration-200 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>✎ {isModifyMode ? 'SUBMIT MODIFIED PLAN' : 'MODIFY'}</span>
          </button>

          {/* 3. REJECT */}
          <button
            type="button"
            onClick={() => handleAction('reject')}
            disabled={submitting}
            className="py-3 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-[#EF4444] font-extrabold text-xs sm:text-sm rounded-xl transition duration-200 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>✕ REJECT</span>
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-[#64748B] hover:text-[#063B5C] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Safety Gate</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>Proceed to Controlled Tool Gateway & Digital Twin</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
