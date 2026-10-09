import React from 'react';
import { ActionPlan } from '../../types';

interface WhyDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ActionPlan | null;
}

export const WhyDecisionModal: React.FC<WhyDecisionModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-command-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-command-900 text-white flex items-center justify-between border-b border-command-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-command-800 border border-command-700 text-petrol-400 flex items-center justify-center text-xs font-mono font-bold">
              LOGIC
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Transparent Decision Chain & Policy Hierarchy
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-petrol-500/20 text-petrol-300 border border-petrol-500/30">
                  AGENTIC REASONING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic priority ordering and multi-agent consensus justification.
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-command-900 text-xs font-mono uppercase tracking-wider mb-1">
              Deterministic Priority Hierarchy
            </h4>
            <p className="text-slate-500 text-[11px]">
              AquaVolt enforces a strict 3-tier hierarchy derived from aquaculture biology and electrical engineering constraints:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 mt-2 font-medium">
              <li>
                <b className="text-command-900">Tier 1 (Life-Critical):</b> Pond Dissolved Oxygen must remain above 4.0 mg/L at all times to prevent catastrophic shrimp mortality.
              </li>
              <li>
                <b className="text-command-900">Tier 2 (Asset Protection):</b> Inrush current must be clamped via VFD soft-start (max 1.2x rated current) to prevent tripping inverter breakers or stalling generators. Cold room must stay within 2.0–5.0°C.
              </li>
              <li>
                <b className="text-command-900">Tier 3 (Economic Optimization):</b> Flexible loads (ice makers, processing lines) are deferred to preserve the 20% battery reserve floor and eliminate peak grid tariff costs.
              </li>
            </ol>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-command-900 text-xs font-mono uppercase tracking-wider mb-1">
              Active Reason for Current Plan ({plan.event_title || plan.event_id})
            </h4>
            <p className="text-slate-800 font-medium bg-white p-3 rounded-lg border border-slate-200 mt-2 font-mono text-[11px]">
              {plan.orchestrator_summary ||
                'Telemetry indicates energy constraints. Non-critical loads shed to sustain life-critical aeration with VFD soft-start.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-900 block mb-1 font-mono">✓ VFD Soft-Start Ramping</span>
              <span className="text-emerald-800">
                Ramps motor from 0 → 50 Hz over 120s, eliminating the 18.5 kW DOL inrush spike.
              </span>
            </div>
            <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
              <span className="font-bold text-sky-900 block mb-1 font-mono">✓ Thermal Pre-Cooling Buffer</span>
              <span className="text-sky-800">
                Refrigeration utilizes stored thermal mass (1.5°C pre-cool) to float safely during power deficit.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-command-900 hover:bg-command-800 text-white text-xs font-semibold rounded-lg transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
