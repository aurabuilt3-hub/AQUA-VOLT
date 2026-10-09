import React from 'react';
import { UnifiedAnalysisResponse, ExecutionResult } from '../../types';
import { ALL_9_SAFETY_POLICIES } from './SafetyMatrixModal';

interface GovernanceViewProps {
  analysis: UnifiedAnalysisResponse | null;
  decisionState: 'pending' | 'approved' | 'modified' | 'rejected';
  submittingAction: boolean;
  onDecisionAction: (action: 'approve' | 'modify' | 'reject') => void;
  isModifyMode: boolean;
  setIsModifyMode: (val: boolean) => void;
  overrideIcePlant: boolean;
  setOverrideIcePlant: (val: boolean) => void;
  overrideProcessing: boolean;
  setOverrideProcessing: (val: boolean) => void;
  feedbackMsg: string | null;
  executionResult: ExecutionResult | null;
  onSwitchToOverview?: () => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  analysis,
  decisionState,
  submittingAction,
  onDecisionAction,
  isModifyMode,
  setIsModifyMode,
  overrideIcePlant,
  setOverrideIcePlant,
  overrideProcessing,
  setOverrideProcessing,
  feedbackMsg,
  executionResult,
  onSwitchToOverview,
}) => {
  const interventionCount = analysis?.safety?.interventions?.length || 0;
  const policiesEvaluated = analysis?.safety?.policies_checked || 9;

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto animate-fadeIn pb-10 font-sans">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. HEADER BANNER                                                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h2 className="text-base font-extrabold text-[#103844] tracking-tight">
              Governance & Operational Approvals
            </h2>
          </div>
          <p className="text-xs text-[#5A7E8C] mt-0.5 font-medium">
            AgentShield deterministic safety policies, human operator review, and load modification governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F8F6] text-[#0E7A68] border border-[#BCEADB]">
            {policiesEvaluated} Deterministic Policies Active
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. OPERATOR'S CURRENT DECISION CARD (PRIMARY FOCUS)                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {analysis ? (
        <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#103844] tracking-tight">
                  Active Dispatch Request: {analysis.event_title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  decisionState === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  decisionState === 'modified' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  decisionState === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                  analysis.safety.approval_required ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-teal-50 text-teal-700 border border-teal-200'
                }`}>
                  {decisionState === 'approved' ? 'APPROVED ✓' :
                   decisionState === 'modified' ? 'MODIFIED ✓' :
                   decisionState === 'rejected' ? 'REJECTED ✕' :
                   analysis.safety.approval_required ? 'OPERATOR SIGN-OFF REQUIRED' : 'AUTO-SAFE PERMITTED'}
                </span>
              </div>
              <p className="text-[11px] text-[#5A7E8C] font-medium mt-0.5">
                Risk Score: <strong className="text-slate-800">{analysis.risk.score}/100</strong> ({analysis.risk.level}) · Status:{' '}
                <strong className="text-slate-800">
                  {policiesEvaluated} policies evaluated · {interventionCount === 0 ? 'All invariants satisfied' : `${interventionCount} approval intervention${interventionCount > 1 ? 's' : ''}`}
                </strong>
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Analysis ID: {analysis.analysis_id || analysis.event_id}
            </div>
          </div>

          {/* Grouped Recommendation & Risk Drivers */}
          <div className="bg-[#FAFDFE] p-4 rounded-xl border border-teal-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🧠</span> Orchestrator Recommendation
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                analysis.risk.score >= 70
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : analysis.risk.score >= 40
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                Risk: {analysis.risk.score}/100 ({analysis.risk.level})
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#103844] leading-relaxed">
              {analysis.orchestration?.reasoning_summary || analysis.situation}
            </p>
            {analysis.risk.reasons && analysis.risk.reasons.length > 0 && (
              <div className="pt-2 border-t border-teal-100/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold text-slate-700 text-[10px] uppercase font-mono">Risk Drivers:</span>
                {analysis.risk.reasons.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium text-[11px]">
                    ⚠️ {r}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active Policy Interventions */}
          {interventionCount > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                SAFETY ENGINE INTERVENTIONS APPLIED BY AGENTSHIELD
              </span>
              <div className="space-y-2">
                {analysis.safety.interventions.map((inv, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-950">
                          {inv.policy_id}
                        </span>
                        <span>{inv.policy_name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                        Intervention Active
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-900/90 font-medium">
                      • <strong>Risk:</strong> {inv.risk_reason}
                    </div>
                    <div className="text-[11px] text-amber-900/90 font-medium">
                      • <strong>Action Taken:</strong> Blocked <em>{inv.blocked_action}</em> → Replaced with <strong>{inv.safe_replacement}</strong> ({inv.safe_replacement_detail}).
                    </div>
                    {inv.protection_message && (
                      <div className="text-[10px] font-bold text-emerald-800 mt-1">
                        ✓ {inv.protection_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Load Segregation: Locked Critical vs Editable Flexible */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Locked Critical Loads */}
            <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <span>🔒</span> Locked Critical Loads
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">
                  Unbypassable
                </span>
              </div>
              <p className="text-[11px] text-teal-800/80 font-medium">
                Pond aerator VFD soft-start (6.4 kW) and cold storage refrigeration (3.2 kW) are permanently locked to preserve stock. Neither AI nor human operators can shed these loads.
              </p>
            </div>

            {/* Editable Flexible Loads */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>✎</span> Editable Auxiliary Loads
                </span>
                <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  Modify Permitted
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Non-critical operations (Ice Plant 3.0 kW, Processing 4.0 kW) can be overridden by authorized operators when battery reserve allows.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {feedbackMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
              decisionState === 'rejected'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              <span className="font-bold text-sm">{decisionState === 'rejected' ? '🛑' : '✓'}</span>
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Modify Controls (Shown when operator enters modify mode) */}
          {isModifyMode && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                  <span>✎</span> Flexible Auxiliary Load Overrides
                </div>
                <button
                  type="button"
                  onClick={() => setIsModifyMode(false)}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
                >
                  Cancel Override
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 bg-white p-3 rounded-lg border border-amber-200 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={overrideIcePlant}
                    onChange={(e) => setOverrideIcePlant(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Force Run Ice Plant (+3.0 kW)</div>
                    <div className="text-[10px] text-slate-500">Draws additional power from battery reserve</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-white p-3 rounded-lg border border-amber-200 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={overrideProcessing}
                    onChange={(e) => setOverrideProcessing(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Force Run Processing Plant (+4.0 kW)</div>
                    <div className="text-[10px] text-slate-500">Permitted only if battery remains &gt; 25%</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Decision Controls: APPROVE · MODIFY · REJECT */}
          {decisionState === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onDecisionAction('approve')}
                disabled={submittingAction}
                className="py-3 px-4 bg-[#0F9F8F] hover:bg-[#0D877A] text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {submittingAction ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>✓ APPROVE & DISPATCH</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDecisionAction('modify')}
                disabled={submittingAction}
                className="py-3 px-4 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>✎ {isModifyMode ? 'CONFIRM MODIFIED PLAN' : 'MODIFY FLEXIBLE LOADS'}</span>
              </button>

              <button
                type="button"
                onClick={() => onDecisionAction('reject')}
                disabled={submittingAction}
                className="py-3 px-4 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                title="Rejection dispatches zero commands to equipment and produces zero execution impact"
              >
                <span>✕ REJECT PROPOSAL</span>
              </button>
            </div>
          )}

          {decisionState !== 'pending' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <span>Decision recorded: <strong>{decisionState.toUpperCase()}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setIsModifyMode(false);
                }}
                className="text-[11px] font-bold text-[#0F9F8F] hover:underline"
              >
                Modify Action Status
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#D5EBF1] rounded-2xl p-5 sm:p-6 text-center shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-lg mx-auto">
            📋
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#103844]">No Active Dispatch Request</h3>
            <p className="text-xs text-[#5A7E8C] max-w-md mx-auto mt-1 font-medium">
              Select an operational scenario and run Pipeline Analysis on Facility Operations to generate an action plan, risk assessment, and deterministic safety evaluation.
            </p>
          </div>
          {onSwitchToOverview && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onSwitchToOverview}
                className="px-4 py-2 bg-[#0F9F8F] hover:bg-[#0D877A] text-white font-bold text-xs rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
              >
                <span>← Return to Facility Operations</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. DETERMINISTIC SAFETY MATRIX (ALL 9 POLICIES REFERENCE)                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-[#103844] tracking-tight">
              Deterministic Safety Invariants (9 Hardcoded Policies)
            </h3>
            <p className="text-[11px] text-[#5A7E8C] font-medium">
              Hardware protection policies evaluated directly in code — LLMs and operators cannot bypass these constraints.
            </p>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            9/9 Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 font-mono">Policy ID</th>
                <th className="py-2.5 px-3">Policy Name</th>
                <th className="py-2.5 px-3">Domain</th>
                <th className="py-2.5 px-3 font-mono">Threshold</th>
                <th className="py-2.5 px-3">Deterministic Safe Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {ALL_9_SAFETY_POLICIES.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-[#0F9F8F] text-[11px] whitespace-nowrap">
                    {p.id}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {p.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {p.cat}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-800 font-bold">
                    {p.threshold}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 leading-relaxed">
                    {p.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
