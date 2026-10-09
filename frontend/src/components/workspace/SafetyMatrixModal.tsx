import React from 'react';

interface SafetyMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ALL_9_SAFETY_POLICIES = [
  { id: 'POLICY_1', name: 'Critical Pond Dissolved Oxygen Floor', threshold: 'DO ≥ 4.0 mg/L', action: 'Hard lock: aerators cannot be turned off when DO is below safe limits.', cat: 'Biological' },
  { id: 'POLICY_2', name: 'Cold Chain Product Safety Envelope', threshold: '2.0°C ≤ Temp ≤ 5.0°C', action: 'Thermal pre-cooling allowed down to 1.5°C; compressor safety interlock prevents warming above 5.0°C.', cat: 'Cold Storage' },
  { id: 'POLICY_3', name: 'Battery Deep Discharge Protection Floor', threshold: 'SOC ≥ 20.0%', action: 'Hard stop: BESS battery cannot be discharged below 20% to prevent cell degradation and blackout trip.', cat: 'Energy Storage' },
  { id: 'POLICY_4', name: 'Diesel Generator Emergency Dispatch Rule', threshold: 'Emergency Only', action: 'Genset startup suppressed unless battery < 20% AND grid offline AND pond DO falling.', cat: 'Generator' },
  { id: 'POLICY_5', name: 'Aerator Soft-Start & Inrush Surge Constraint', threshold: 'Inrush ≤ 1.2x rated', action: 'Direct-on-line aerator starts blocked. Enforces VFD 120s frequency ramp (0 → 50 Hz).', cat: 'Motor Control' },
  { id: 'POLICY_6', name: 'Peak Grid Tariff Cost Optimization Gate', threshold: 'Avoid ₹9.50/kWh', action: 'Draw from solar and pre-cooled thermal buffer during peak tariff hours to minimize electricity bills.', cat: 'Economic' },
  { id: 'POLICY_7', name: 'Human-in-the-Loop Approval Threshold', threshold: 'Risk Score ≥ 40/100', action: 'High-risk actions require operator confirmation before simulated command dispatch.', cat: 'Governance' },
  { id: 'POLICY_8', name: 'Telemetry Freshness & Sensor Watchdog', threshold: 'Heartbeat < 30s', action: 'If IoT heartbeat is delayed, system falls back into fail-safe deterministic preservation mode.', cat: 'Reliability' },
  { id: 'POLICY_9', name: 'Load Interlock & Anti-Islanding Protection', threshold: 'Standard IEEE 1547', action: 'Prevents energizing faulted grid circuits; ensures clean microgrid separation upon grid failure.', cat: 'Electrical Safety' },
];

export const SafetyMatrixModal: React.FC<SafetyMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-command-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-command-900 text-white flex items-center justify-between border-b border-command-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-command-800 border border-command-700 text-petrol-400 flex items-center justify-center text-sm font-mono font-bold">
              9P
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  AquaVolt 9-Policy Deterministic Safety Matrix
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-petrol-500/20 text-petrol-300 border border-petrol-500/30">
                  DETERMINISTIC · AGENTSHIELD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic policy verification rules protecting biological life, physical machinery, and microgrid assets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-command-800 hover:bg-command-700 text-slate-300 hover:text-white flex items-center justify-center text-xs font-mono transition"
            title="Close matrix"
          >
            ✕
          </button>
        </div>

        {/* Content Table */}
        <div className="p-5 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 font-mono">Policy ID</th>
                <th className="py-2.5 px-3">Policy Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 font-mono">Safety Threshold</th>
                <th className="py-2.5 px-3">Deterministic Safe Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {ALL_9_SAFETY_POLICIES.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-petrol-700 text-[11px] whitespace-nowrap">
                    {p.id}
                  </td>
                  <td className="py-3 px-3 font-bold text-command-900">
                    {p.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {p.cat}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-command-800 font-bold">
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

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Strict hardcoded overrides — unbypassable by LLM or manual operators</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-command-900 hover:bg-command-800 text-white text-xs font-semibold rounded-lg transition border border-command-800"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
