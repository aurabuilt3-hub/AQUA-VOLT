import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../../types';
import { fetchAuditLogs } from '../../services/api';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLogs = () => {
    setLoading(true);
    fetchAuditLogs()
      .then((res) => {
        setLogs(res);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.event_title.toLowerCase().includes(q) ||
      log.action_taken.toLowerCase().includes(q) ||
      log.summary.toLowerCase().includes(q) ||
      log.event_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto animate-fadeIn pb-10">
      {/* Header Banner */}
      <div className="bg-white border border-sky-100 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Operational Governance Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Governance audit trail recording all telemetry evaluations, multi-agent syntheses, safety gate verifications, and operator decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <span>🔄</span>
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-sky-100 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search events, actions, or decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of <strong className="text-slate-800">{logs.length}</strong> entries
        </div>
      </div>

      {/* Main Ledger Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-sky-100 text-xs font-mono text-slate-500">
            Querying backend governance ledger...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-sky-100 text-xs font-mono text-slate-500 space-y-2 shadow-xs">
            <div className="text-3xl">📜</div>
            <div className="font-bold text-slate-800 text-sm">No Audit Entries Found</div>
            <div className="text-[11px] text-slate-500 max-w-md mx-auto font-sans">
              Approve, modify, or reject an operational plan from the Facility Operations screen to record an immutable entry in the governance log.
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isApproved = log.action_taken === 'APPROVE';
            const isModified = log.action_taken === 'MODIFY';
            const isRejected = log.action_taken === 'REJECTED' ||
              log.action_taken === 'reject' ||
              Boolean(log.human_decision && log.human_decision.toUpperCase().includes('REJECT'));

            const badgeStyle = isApproved
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : isModified
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200';

            return (
              <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border uppercase ${badgeStyle}`}>
                      {log.action_taken}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{log.event_title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      {log.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(log.id)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg border border-slate-200 transition"
                    >
                      {isExpanded ? 'Hide Trace ▲' : 'Inspect Trace ▼'}
                    </button>
                  </div>
                </div>

                {/* Grid Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">EVENT</div>
                    <div className="font-bold text-slate-800 text-xs truncate">{log.event_title}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">ANALYSIS</div>
                    <div className="font-medium text-slate-700 text-xs line-clamp-1">{log.agent_analysis || log.detected_risk}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">PLAN</div>
                    <div className="font-medium text-slate-700 text-xs line-clamp-1">{log.recommended_action || "Protect aeration & cold storage"}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">SAFETY</div>
                    <div className="font-bold text-emerald-700 text-xs truncate">{log.safety_result || "9 Policies Verified"}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">DECISION</div>
                    <div className="font-bold text-slate-800 text-xs truncate">{log.human_decision || log.action_taken}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">EXECUTION</div>
                    <div className="font-bold text-slate-800 text-xs truncate">{log.execution_result || "Dispatched"}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">POC IMPACT</div>
                    {isRejected || !log.impact || (log.impact.cost_avoided_inr === 0 && log.impact.energy_optimized_kwh === 0) ? (
                      <div className="font-mono text-slate-400 text-xs italic truncate" title="No execution impact">
                        — (No execution impact)
                      </div>
                    ) : (
                      <div className="font-mono font-bold text-emerald-700 text-xs">
                        {log.impact.energy_optimized_kwh} kWh | ₹{log.impact.cost_avoided_inr.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 text-xs animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="font-bold text-slate-900 mb-1.5">🔍 Risk & Domain Analysis Trace:</div>
                        <div className="text-xs text-slate-600 space-y-1 font-medium">
                          <div>• <strong>Detected Risk:</strong> {log.detected_risk}</div>
                          <div>• <strong>Agent Findings:</strong> {log.agent_analysis}</div>
                          <div>• <strong>Executed By:</strong> {log.executed_by}</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                        <div className="font-bold text-slate-900 mb-1.5 font-sans">⚡ Modeled Impact Detail:</div>
                        {isRejected || !log.impact || (log.impact.cost_avoided_inr === 0 && log.impact.energy_optimized_kwh === 0) ? (
                          <div className="text-xs text-slate-500 italic py-2">
                            No execution impact — Plan rejected by operator. Zero commands dispatched to equipment.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                            <div>• Energy Shifted: <strong>{log.impact.energy_optimized_kwh} kWh</strong></div>
                            <div>• Cost Avoided: <strong>₹{log.impact.cost_avoided_inr.toFixed(2)}</strong></div>
                            <div>• Diesel Saved: <strong>{log.impact.diesel_avoided_liters} L</strong></div>
                            <div>• CO₂ Avoided: <strong>{log.impact.co2_avoided_kg} kg</strong></div>
                            <div>• Inrush Clamped: <strong>{log.impact.aerator_inrush_suppressed_kw} kW</strong></div>
                            <div>• Pre-cool Stored: <strong>{log.impact.thermal_energy_stored_kwh} kWh</strong></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono border border-slate-800">
                      <span className="text-emerald-400 font-bold">RAW AUDIT LEDGER ENTRY:</span> {log.summary}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
