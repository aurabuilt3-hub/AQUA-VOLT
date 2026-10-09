import React from 'react';
import { UnifiedAnalysisResponse } from '../../types';

interface AgentOperationsViewProps {
  analysis: UnifiedAnalysisResponse | null;
  loading: boolean;
  onRunAnalysis: () => void;
  expandedSpecialist: string | null;
  onToggleSpecialist: (agentId: string) => void;
  decisionState?: 'pending' | 'approved' | 'modified' | 'rejected';
  executionResult?: any;
}

export const AgentOperationsView: React.FC<AgentOperationsViewProps> = ({
  analysis,
  loading,
  onRunAnalysis,
  expandedSpecialist,
  onToggleSpecialist,
  decisionState = 'pending',
  executionResult,
}) => {
  const approvalReq = analysis?.safety?.approval_required ?? false;

  const step7Status = loading
    ? 'EVALUATING...'
    : !analysis
    ? 'READY'
    : approvalReq
    ? decisionState === 'approved'
      ? 'APPROVED'
      : decisionState === 'modified'
      ? 'MODIFIED & APPROVED'
      : decisionState === 'rejected'
      ? 'REJECTED'
      : 'APPROVAL PENDING'
    : 'AUTO-CLEARED';

  const step8Status = loading
    ? 'STANDBY'
    : !analysis
    ? 'STANDBY'
    : approvalReq && decisionState === 'pending'
    ? 'BLOCKED PENDING APPROVAL'
    : decisionState === 'rejected'
    ? 'EXECUTION BLOCKED'
    : 'DISPATCHED';

  const step8Detail = !analysis
    ? 'Controlled Tool Gateway enforces parameter bounds; dispatches zero commands on rejection.'
    : decisionState === 'rejected'
    ? 'Dispatch halted by operator rejection. Zero Tool Gateway commands transmitted.'
    : decisionState === 'pending' && approvalReq
    ? 'Command dispatch held at gate until explicit human operator authorization.'
    : 'Hardware bounds verified. Safe commands dispatched to Digital Twin.';

  const step9Status = loading
    ? 'STANDBY'
    : !analysis || (approvalReq && decisionState === 'pending')
    ? 'STANDBY'
    : decisionState === 'rejected'
    ? 'STATE UNCHANGED'
    : 'SIMULATED EXECUTION';

  const step9Detail = !analysis
    ? 'Simulates equipment responses in software. No physical machinery connected.'
    : decisionState === 'rejected'
    ? 'Execution rejected. Digital Twin equipment state preserved without change.'
    : decisionState === 'pending' && approvalReq
    ? 'Awaiting execution confirmation before updating simulated equipment state.'
    : 'Simulated motor soft-start and thermal pre-cooling states updated successfully.';

  const step10Status = loading
    ? 'STANDBY'
    : !analysis
    ? 'STANDBY'
    : approvalReq && decisionState === 'pending'
    ? 'PENDING SIGN-OFF'
    : decisionState === 'rejected'
    ? 'RECORDED (REJECTED)'
    : 'RECORDED (EXECUTED)';

  const step10Detail = !analysis
    ? 'Governance audit entry recorded with transaction-specific impact metrics.'
    : decisionState === 'rejected'
    ? 'Rejection recorded in audit trail with 0 commands dispatched and 0 realized impact.'
    : decisionState === 'pending' && approvalReq
    ? 'Session transaction open awaiting human sign-off before logging outcome.'
    : 'Immutable audit entry recorded with realized impact and cryptographic verification.';

  const steps = [
    {
      num: 1,
      title: 'Input received',
      subtitle: 'Observation Ingestion',
      status: loading ? 'INGESTING...' : (analysis ? 'COMPLETED' : 'READY'),
      detail: analysis ? `Operational input: "${analysis.raw_input.slice(0, 65)}..."` : 'Ingests telemetry from sensors or selected operational scenario.',
      icon: '📡',
    },
    {
      num: 2,
      title: 'Telemetry normalized',
      subtitle: 'Schema Verification',
      status: loading ? 'VALIDATING...' : (analysis ? 'COMPLETED' : 'READY'),
      detail: 'Validates physiological thresholds, inrush limits, and IEEE 1547 electrical constraints.',
      icon: '📐',
    },
    {
      num: 3,
      title: 'Specialist analysis',
      subtitle: '4 Domain Services',
      status: loading ? 'ANALYZING...' : (analysis ? 'COMPLETED' : 'READY'),
      detail: analysis ? 'Pond, Energy, Cold Chain, and Risk specialists evaluated telemetry in parallel.' : '4 specialist services evaluate biological and electrical constraints.',
      icon: '🦐',
    },
    {
      num: 4,
      title: 'Risk assessment',
      subtitle: 'Dynamic Risk Engine',
      status: loading ? 'SCORING...' : (analysis ? (analysis.risk?.score >= 40 ? 'ELEVATED' : 'LOW') : 'READY'),
      detail: analysis ? `Computed risk score: ${analysis.risk.score}/100 (${analysis.risk.level}). Drivers: ${analysis.risk.reasons.join(', ')}` : 'Synthesizes multi-domain alerts into transparent risk score.',
      icon: '⚖️',
    },
    {
      num: 5,
      title: 'Orchestration and optimization',
      subtitle: 'Load Allocator',
      status: loading ? 'OPTIMIZING...' : (analysis ? 'OPTIMIZED' : 'READY'),
      detail: analysis?.orchestration?.reasoning_summary || 'Coordinates PROTECT, OPTIMIZE, and DEFER resource allocations.',
      icon: '🧠',
    },
    {
      num: 6,
      title: 'Safety evaluation',
      subtitle: '9 Deterministic Policies',
      status: loading ? 'VERIFYING...' : (analysis ? 'VERIFIED' : 'READY'),
      detail: analysis ? `${analysis.safety.policies_passed}/${analysis.safety.policies_checked} policies passed. Interventions: ${analysis.safety.interventions?.length || 0}.` : 'AgentShield deterministic safety verification gates.',
      icon: '🛡️',
    },
    {
      num: 7,
      title: 'Human approval gate',
      subtitle: 'Operator Review Threshold',
      status: step7Status,
      detail: analysis?.safety.approval_required ? 'Mandatory operator confirmation required before actuation.' : 'Low risk operates autonomously under AUTO_SAFE.',
      icon: '👤',
    },
    {
      num: 8,
      title: 'Tool Gateway',
      subtitle: 'Controlled Command Dispatch',
      status: step8Status,
      detail: step8Detail,
      icon: '⚡',
    },
    {
      num: 9,
      title: 'Digital Twin result',
      subtitle: 'Simulated Model Sync',
      status: step9Status,
      detail: step9Detail,
      icon: '🔄',
    },
    {
      num: 10,
      title: 'Audit record',
      subtitle: 'Governance Ledger',
      status: step10Status,
      detail: step10Detail,
      icon: '📜',
    },
  ];

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto animate-fadeIn pb-10 font-sans">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. HEADER & QUERY-TO-PIPELINE METADATA BANNER                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <h2 className="text-base font-extrabold text-[#103844] tracking-tight">
                Agent Operations & Pipeline Trace
              </h2>
            </div>
            <p className="text-xs text-[#5A7E8C] mt-0.5 font-medium">
              Live execution trace of 4 specialist domain services coordinated by the AquaVolt Orchestrator
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRunAnalysis}
              disabled={loading}
              className="px-4 py-2 bg-[#0F9F8F] hover:bg-[#0D877A] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-xs shrink-0"
              title="Dispatches genuine analysis request to backend POST /api/analyze"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Pipeline...</span>
                </>
              ) : (
                <>
                  <span>⚡ Re-run Pipeline Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trace Metadata Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Current Submitted Query */}
          <div className="md:col-span-6 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                ACTIVE SUBMITTED QUERY
              </span>
              {analysis?.analysis_id && (
                <span className="text-[10px] font-mono text-[#0F9F8F] bg-[#E6F8F6] px-2 py-0.5 rounded font-bold">
                  ID: {analysis.analysis_id}
                </span>
              )}
            </div>
            <p className="font-medium text-[#103844] text-xs leading-relaxed italic">
              "{analysis?.raw_input || 'Solar generation dropped 60%. Battery SOC is 38%. Pond DO is 4.2 mg/L and falling. Cold room is 4.3°C. Facility load is 18.3 kW. Grid is available.'}"
            </p>
          </div>

          {/* Computed Risk & Outcome Summary */}
          <div className="md:col-span-6 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                COMPUTED RISK & CONSENSUS
              </span>
              {analysis?.risk && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  analysis.risk.score >= 70 ? 'bg-rose-100 text-rose-800' :
                  analysis.risk.score >= 40 ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  Score {analysis.risk.score}/100 · {analysis.risk.level}
                </span>
              )}
            </div>
            <p className="font-medium text-slate-700 text-xs leading-relaxed line-clamp-2">
              {analysis?.orchestration?.reasoning_summary || analysis?.situation || 'Multi-agent evaluation completed. Critical aeration and cold storage protected.'}
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/50">
              <span>Orchestrator Provider:</span>
              <span className={`font-semibold ${analysis?.ai_used ? 'text-teal-700' : 'text-slate-600'}`}>
                {analysis?.ai_used ? '✨ Gemini 2.5 Flash' : `Deterministic Fallback (${analysis?.ai_fallback_reason || 'Safe Mode'})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. FOUR SPECIALIST AGENT FINDINGS GRID                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {analysis && (
        <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#103844] tracking-tight">
                Domain Specialist Findings (4 Autonomous Services)
              </h3>
              <p className="text-[11px] text-[#5A7E8C] font-medium">
                Click any specialist card to expand raw sensor telemetry and threshold calculations.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F8F6] text-[#0E7A68] border border-[#BCEADB]">
              4 Specialists Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(analysis.agents).map((ag) => {
              const isExpanded = expandedSpecialist === ag.agent_id;
              return (
                <div
                  key={ag.agent_id}
                  onClick={() => onToggleSpecialist(ag.agent_id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isExpanded
                      ? 'bg-[#EBF7FB] border-[#0284C7] ring-2 ring-[#0284C7]/20 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">{ag.icon}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        ag.status === 'critical' ? 'bg-rose-100 text-rose-800' :
                        ag.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {ag.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-[#103844] text-xs sm:text-sm tracking-tight">{ag.agent_name}</h4>
                    <div className="mt-1.5 space-y-1">
                      {ag.findings.slice(0, 2).map((f: string, fIdx: number) => (
                        <p key={fIdx} className="text-[11px] text-[#4E7684] font-medium leading-relaxed">
                          • {f}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-[#0F9F8F]">
                      <span>{isExpanded ? 'Hide Raw Telemetry ▲' : 'Inspect Telemetry ▼'}</span>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 space-y-1.5 animate-fadeIn">
                        {Object.entries(ag.key_metrics || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11px] bg-white p-1.5 rounded border border-slate-200">
                            <span className="text-slate-500 font-medium">{k}</span>
                            <span className="font-bold font-mono text-slate-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. ORCHESTRATION & SAFETY OUTCOMES BELOW SPECIALISTS                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Orchestrator Output */}
          <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">⚖️</span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#103844] tracking-tight">
                  AquaVolt Orchestrator Consensus
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#0F9F8F] bg-[#E6F8F6] px-2 py-0.5 rounded">
                Dynamic Priority Sequence
              </span>
            </div>

            <p className="text-xs text-[#4E7684] font-medium leading-relaxed">
              {analysis.orchestration?.reasoning_summary}
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                PRIORITY ALLOCATION STAGES
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.orchestration?.priority_order?.map((p, idx) => (
                  <span key={idx} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0F9F8F] text-white flex items-center justify-center text-[9px] font-mono font-bold">
                      {idx + 1}
                    </span>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Safety Engine Validation */}
          <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#103844] tracking-tight">
                  Deterministic Safety Verification
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {analysis.safety.policies_passed}/{analysis.safety.policies_checked} Passed
              </span>
            </div>

            <p className="text-xs text-[#4E7684] font-medium leading-relaxed">
              AgentShield deterministic safety invariants evaluated prior to dispatch. Zero unvetted commands reach the Tool Gateway.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Human Operator Sign-Off:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  analysis.safety.approval_required ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {analysis.safety.approval_required ? 'MANDATORY APPROVAL' : 'AUTO-SAFE PERMITTED'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Safety Interventions:</span>
                <span className="font-mono font-bold text-slate-700">
                  {analysis.safety.interventions?.length || 0} applied
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Action Plan (PROTECT, OPTIMIZE, DEFER) & Execution State */}
      {analysis && (
        <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-100 gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#103844] tracking-tight">
                Unified Orchestrated Action Plan
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                analysis.decision.status === 'AUTO_SAFE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                analysis.decision.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                analysis.decision.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                Decision State: {analysis.decision.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* PROTECT */}
            <div className="bg-[#FAFDFE] border border-teal-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-teal-200/60 text-xs font-bold text-teal-900">
                <span className="flex items-center gap-1">🔒 PROTECT (Life-Critical)</span>
                <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-teal-200 text-teal-700">Locked</span>
              </div>
              <div className="space-y-1.5">
                {analysis.plan.protect.map((it) => (
                  <div key={it.id} className="bg-white p-2 rounded border border-teal-100 text-xs shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px]">{it.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{it.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* OPTIMIZE */}
            <div className="bg-[#FAFDFE] border border-sky-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-sky-200/60 text-xs font-bold text-sky-900">
                <span className="flex items-center gap-1">⚡ OPTIMIZE (Microgrid)</span>
                <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-sky-200 text-sky-700">Dynamic</span>
              </div>
              <div className="space-y-1.5">
                {analysis.plan.energy_strategy.map((it) => (
                  <div key={it.id} className="bg-white p-2 rounded border border-sky-100 text-xs shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px]">{it.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{it.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* DEFER */}
            <div className="bg-[#FAFDFE] border border-amber-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200/60 text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1">⏸ DEFER (Auxiliary)</span>
                <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-amber-200 text-amber-800">Paused</span>
              </div>
              <div className="space-y-1.5">
                {analysis.plan.defer.map((it) => (
                  <div key={it.id} className="bg-white p-2 rounded border border-amber-100 text-xs shadow-2xs">
                    <div className="font-bold text-slate-900 text-[11px]">{it.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{it.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. 10-STEP PIPELINE SEQUENTIAL TRACE                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-[#103844] tracking-tight">
              10-Step Analysis & Execution Workflow
            </h3>
            <p className="text-[11px] text-[#5A7E8C] font-medium">
              Deterministic sequencing guarantees that safety overrides and operator gates are non-bypassable.
            </p>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Stages 1 → 10
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((st) => (
            <div
              key={st.num}
              className="flex items-center gap-3 p-2.5 sm:p-3 bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition"
            >
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-[#0F9F8F] shrink-0 shadow-2xs">
                {st.num}
              </div>

              <span className="text-base shrink-0">{st.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{st.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">• {st.subtitle}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {st.detail}
                </p>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 border ${
                st.status === 'CRITICAL' || st.status === 'REJECTED' || st.status === 'EXECUTION BLOCKED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : st.status === 'WARNING' || st.status === 'ELEVATED' || st.status === 'APPROVAL PENDING' || st.status === 'BLOCKED PENDING APPROVAL' || st.status === 'PENDING SIGN-OFF'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : st.status === 'READY' || st.status === 'STANDBY'
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : st.status.includes('...')
                  ? 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {st.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
