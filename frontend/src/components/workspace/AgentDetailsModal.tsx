import React from 'react';
import { AgentAnalysis } from '../../types';

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: AgentAnalysis[];
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  isOpen,
  onClose,
  analyses,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-command-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-command-900 text-white flex items-center justify-between border-b border-command-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-command-800 border border-command-700 text-petrol-400 flex items-center justify-center text-xs font-mono font-bold">
              AGENTS
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Specialist Domain Agent Findings & Telemetry Analysis
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-petrol-500/20 text-petrol-300 border border-petrol-500/30">
                  4 SPECIALISTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-agent domain evaluation across aquaculture biological limits, power dispatch, cold storage safety, and operational risk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-command-800 hover:bg-command-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-mono transition"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyses.map((agent) => {
              const statusBg =
                agent.status === 'critical'
                  ? 'bg-rose-50/70 border-rose-200'
                  : agent.status === 'warning'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-50 border-slate-200';

              const badgeColor =
                agent.status === 'critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : agent.status === 'warning'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300';

              return (
                <div key={agent.agent_id} className={`p-4 rounded-xl border ${statusBg} flex flex-col justify-between shadow-2xs`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{agent.icon}</span>
                        <h3 className="text-xs font-bold text-command-900 font-mono uppercase tracking-wide">
                          {agent.agent_name}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                        {agent.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Domain Findings:
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {agent.findings.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-command-700 font-bold shrink-0">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Key Evaluated Metrics:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(agent.key_metrics).map(([k, v]) => (
                        <div key={k} className="bg-white px-2 py-1 rounded border border-slate-200 text-[10px] font-mono font-medium text-slate-600">
                          {k}: <b className="text-command-900 font-bold">{v}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-command-900 hover:bg-command-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Close Findings
          </button>
        </div>
      </div>
    </div>
  );
};
