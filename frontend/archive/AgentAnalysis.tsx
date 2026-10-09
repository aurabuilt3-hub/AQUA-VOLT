import React, { useState } from 'react';
import { ActionPlan } from '../types';

interface AgentAnalysisProps {
  plan: ActionPlan | null;
  loading: boolean;
}

export const AgentAnalysis: React.FC<AgentAnalysisProps> = ({ plan, loading }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (loading || !plan) {
    return (
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 shadow-card-float h-full flex flex-col justify-center items-center py-16">
        <div className="w-12 h-12 border-4 border-[#00B8D9] border-t-transparent rounded-full animate-spin mb-3 shadow-glow-aqua" />
        <div className="text-xs font-extrabold text-[#063B5C]">AquaVolt Multi-Agent Engine Analyzing...</div>
        <div className="text-[11px] text-[#64748B] mt-1 font-medium text-center">
          Executing Pond, Energy, Cold Chain & Risk Agents deterministically
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 shadow-card-float h-full flex flex-col">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
            2
          </span>
          <h2 className="text-lg font-extrabold text-[#063B5C]">Multi-Agent Domain Analysis</h2>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-bold text-[#087EA4] hover:text-[#0096B3] bg-[#E0F7FA] hover:bg-[#EFFBFC] px-3 py-1 rounded-xl border border-[#00B8D9]/30 transition flex items-center gap-1 shrink-0"
        >
          {showDetails ? '🔒 Hide details' : '🔍 View details'}
        </button>
      </div>

      <p className="text-xs text-[#64748B] mb-3.5 pl-9 font-medium">
        4 Specialist Agents evaluated telemetry thresholds independently.
      </p>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px] pr-1">
        {plan.agent_analyses.map((agent) => {
          const statusBg =
            agent.status === 'critical'
              ? 'bg-rose-50/80 border-rose-200'
              : agent.status === 'warning'
              ? 'bg-amber-50/80 border-amber-200'
              : 'bg-[#EFFBFC] border-[#00B8D9]/20';

          const iconBadge =
            agent.status === 'critical'
              ? 'text-[#EF4444] bg-rose-100 border-rose-200 font-extrabold'
              : agent.status === 'warning'
              ? 'text-[#F59E0B] bg-amber-100 border-amber-200 font-extrabold'
              : 'text-[#10B981] bg-emerald-100 border-emerald-200 font-extrabold';

          const summaryText = agent.findings[0] || 'Domain metrics within safe bounds.';

          return (
            <div key={agent.agent_id} className={`p-4 rounded-2xl border ${statusBg} transition-all duration-200 shadow-xs hover:shadow-card-float`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl select-none">{agent.icon}</span>
                  <h3 className="text-xs font-extrabold text-[#063B5C]">{agent.agent_name}</h3>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${iconBadge}`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-[#17324D] font-medium leading-relaxed">
                {summaryText}
              </p>

              {/* Key Metrics row */}
              <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200/50">
                {Object.entries(agent.key_metrics).map(([k, v]) => (
                  <div key={k} className="text-[10px] bg-white border border-[#00B8D9]/20 px-2.5 py-1 rounded-lg font-semibold text-[#64748B]">
                    {k}: <b className="text-[#063B5C]">{v}</b>
                  </div>
                ))}
              </div>

              {showDetails && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 space-y-2">
                  <ul className="space-y-1">
                    {agent.findings.slice(1).map((finding, idx) => (
                      <li key={idx} className="text-[11px] text-[#64748B] flex items-start gap-1.5 font-medium">
                        <span className="text-[#00B8D9] select-none">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}

        {/* Orchestrator Result Card */}
        <div className="p-4 border border-[#00B8D9]/40 bg-gradient-to-r from-[#063B5C] to-[#087EA4] text-white rounded-2xl shadow-card-float mt-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">🧠</span>
            <h3 className="text-xs font-extrabold text-[#36D7E8] uppercase tracking-wider">
              AquaVolt Orchestrator Result
            </h3>
          </div>
          <p className="text-xs text-cyan-50 leading-relaxed font-medium">
            {plan.orchestrator_summary}
          </p>
        </div>
      </div>
    </div>
  );
};
