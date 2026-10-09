import React, { useState } from 'react';
import { SafetyIntervention } from '../types';

interface SafetyInterventionPanelProps {
  interventions: SafetyIntervention[];
  requiresHumanApproval: boolean;
}

const POLICY_STYLE: Record<string, { icon: string; accent: string; bg: string; border: string; dotColor: string }> = {
  POLICY_1: { icon: '🐟', accent: 'text-[#087EA4]',   bg: 'bg-[#E0F7FA]/60', border: 'border-[#00B8D9]/30', dotColor: 'bg-[#00B8D9]' },
  POLICY_2: { icon: '❄️', accent: 'text-[#0096B3]',   bg: 'bg-cyan-50/60',   border: 'border-cyan-200',    dotColor: 'bg-cyan-500' },
  POLICY_3: { icon: '🔋', accent: 'text-purple-800', bg: 'bg-purple-50/60', border: 'border-purple-200',  dotColor: 'bg-purple-500' },
  POLICY_4: { icon: '⚡', accent: 'text-[#063B5C]',   bg: 'bg-slate-50/80',  border: 'border-slate-200',   dotColor: 'bg-slate-500' },
  POLICY_5: { icon: '🌀', accent: 'text-indigo-800', bg: 'bg-indigo-50/60', border: 'border-indigo-200',  dotColor: 'bg-indigo-500' },
  POLICY_6: { icon: '☀️', accent: 'text-[#087EA4]',  bg: 'bg-[#E0F7FA]/60', border: 'border-[#00B8D9]/30', dotColor: 'bg-[#00B8D9]' },
  POLICY_7: { icon: '👤', accent: 'text-[#EF4444]',   bg: 'bg-rose-50/60',   border: 'border-rose-200',    dotColor: 'bg-[#EF4444]' },
  POLICY_8: { icon: '📡', accent: 'text-slate-800',  bg: 'bg-slate-50/60',  border: 'border-slate-200',   dotColor: 'bg-slate-500' },
  POLICY_9: { icon: '🔐', accent: 'text-[#EF4444]',   bg: 'bg-rose-50/60',   border: 'border-rose-200',    dotColor: 'bg-[#EF4444]' },
};

const DEFAULT_STYLE = { icon: '🛡️', accent: 'text-[#063B5C]', bg: 'bg-[#EFFBFC]', border: 'border-[#00B8D9]/20', dotColor: 'bg-[#00B8D9]' };

interface InterventionCardProps {
  item: SafetyIntervention;
  index: number;
}

const InterventionCard: React.FC<InterventionCardProps> = ({ item }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const style = POLICY_STYLE[item.policy_id] ?? DEFAULT_STYLE;

  const detailSegments = item.safe_replacement_detail
    .split(' · ')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden shadow-xs hover:shadow-card-float transition duration-200`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <span className="text-2xl select-none shrink-0 mt-0.5">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${style.border} ${style.accent} bg-white`}>
              {item.policy_id.replace('_', ' ')}
            </span>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
              {item.policy_name}
            </span>
          </div>
          <p className={`text-sm font-extrabold mt-1.5 ${style.accent} leading-snug`}>
            ✓ {item.protection_message}
          </p>
        </div>
      </div>

      {/* 5-Field Grid */}
      <div className="px-4 pb-4 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B] mb-1">
              Original Proposed Action
            </div>
            <p className="text-xs font-semibold text-[#17324D] leading-snug">
              {item.original_action}
            </p>
          </div>
          <div className="bg-rose-50/90 rounded-xl border border-rose-200 p-3">
            <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#EF4444] mb-1">
              ⚠️ Why It Was Unsafe
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              {item.risk_reason}
            </p>
          </div>
        </div>

        {/* Safe Replacement */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
          <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#10B981] mb-1">
            ✓ AquaVolt's Safe Replacement
          </div>
          <p className="text-xs font-bold text-emerald-900 leading-relaxed">
            {item.safe_replacement}
          </p>
        </div>

        {/* Detail Collapsible */}
        <button
          onClick={() => setDetailOpen(v => !v)}
          className="w-full text-left text-[10px] font-bold text-[#087EA4] hover:text-[#0096B3] flex items-center gap-1.5 transition-colors"
          aria-expanded={detailOpen}
        >
          <span className={`transition-transform duration-200 ${detailOpen ? 'rotate-90' : ''}`}>▶</span>
          {detailOpen ? 'Hide' : 'Show'} technical detail
        </button>
        {detailOpen && (
          <div className="bg-[#031D2E] text-white rounded-xl p-3 space-y-1">
            {detailSegments.map((seg, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-cyan-100 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} shrink-0 mt-1.5`} />
                {seg}
              </div>
            ))}
          </div>
        )}

        {/* HITL requirement indicator */}
        {item.requires_human_approval ? (
          <div className="flex items-center gap-2 bg-white border border-rose-200 rounded-xl px-3 py-2">
            <span className="text-[#EF4444] text-sm select-none">👤</span>
            <span className="text-xs font-bold text-rose-700">
              Human approval required before any action is taken
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-2">
            <span className="text-[#10B981] text-sm select-none">✓</span>
            <span className="text-xs font-semibold text-[#10B981]">
              Auto-safe action — no operator input required
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const SafetyInterventionPanel: React.FC<SafetyInterventionPanelProps> = ({
  interventions,
  requiresHumanApproval
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!interventions || interventions.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-2xs my-4">
        <span className="text-xl select-none">🛡️</span>
        <div>
          <h3 className="text-xs font-bold text-command-900 font-mono uppercase tracking-wider">Safety Engine: All Clear</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            All 9 deterministic safety policies passed without interventions. AquaVolt confirmed plan safety.
          </p>
        </div>
        <span className="ml-auto text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded shrink-0">
          ✓ 9/9 POLICIES PASSED
        </span>
      </div>
    );
  }

  const blockedCount = interventions.filter(i => !['POLICY_6'].includes(i.policy_id)).length;
  const verifiedCount = interventions.filter(i => i.policy_id === 'POLICY_6').length;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm my-4 overflow-hidden">
      {/* Header */}
      <div className="bg-command-900 px-6 py-4 flex items-center justify-between gap-3 text-white border-b border-command-800">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-command-800 border border-command-700 text-petrol-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
            SAFE
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
              AquaVolt Deterministic Safety Interventions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The Safety Engine reviewed the proposed plan and applied deterministic safety overrides.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="shrink-0 text-xs font-mono font-semibold text-slate-300 hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand safety interventions' : 'Collapse safety interventions'}
        >
          {collapsed ? '▼ SHOW' : '▲ HIDE'}
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600" />
          <span className="text-[11px] font-bold text-slate-800">
            {blockedCount} action{blockedCount !== 1 ? 's' : ''} blocked / repaired
          </span>
        </div>
        {verifiedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-[11px] font-bold text-slate-800">
              {verifiedCount} action{verifiedCount !== 1 ? 's' : ''} verified safe
            </span>
          </div>
        )}
        {requiresHumanApproval ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
              Mandatory Operator Approval Required
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-bold text-emerald-700 ml-auto">
            ✓ Auto-safe execution permitted
          </span>
        )}
      </div>

      {/* Cards */}
      {!collapsed && (
        <div className="p-5 space-y-4">
          {interventions.map((item, idx) => (
            <InterventionCard key={item.policy_id} item={item} index={idx} />
          ))}

          <div className="mt-2 pt-4 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-500 leading-relaxed">
            <span className="text-command-700 font-bold font-mono text-sm shrink-0">ℹ</span>
            <span>
              All interventions above are applied by AquaVolt's deterministic Safety Engine — not by AI. 
              The Safety Engine enforces 9 hardcoded policies and cannot be overridden by the AI Gateway, 
              the Orchestrator, or any user action. Every change is logged in the Audit Trail.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
