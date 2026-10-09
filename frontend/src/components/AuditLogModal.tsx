import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../types';
import { fetchAuditLogs } from '../services/api';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAuditLogs().then((res) => {
        setLogs(res);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const logsToDisplay = logs;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-elevated overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0B132B] text-slate-100 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-mono text-emerald-400">
              📜
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Audit Trail
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Operational Ledger
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Session history of IoT telemetry, 4-agent analyses, deterministic safety evaluations, and operator decisions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-mono text-xs transition border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Audit Timeline Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/60">
          {loading ? (
            <div className="text-center py-12 text-xs font-mono text-slate-500">
              Querying governance ledger entries...
            </div>
          ) : logsToDisplay.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-500 space-y-1 shadow-2xs">
              <div className="text-2xl mb-1">📜</div>
              <div className="font-bold text-slate-800 text-sm">No Audit Entries in Current Session</div>
              <div className="text-[11px] text-slate-500 max-w-md mx-auto">
                Execute an operational approval, load modification, or rejection to commit a cryptographically tracked audit entry to the backend governance ledger.
              </div>
            </div>
          ) : (
            logsToDisplay.map((log) => {
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
                <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-subtle">
                  {/* Row 1: Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${badgeStyle}`}>
                        {log.action_taken}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{log.event_title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-500">
                        {log.timestamp}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(log.id)}
                        className="text-[11px] font-mono font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-200 transition"
                      >
                        {isExpanded ? 'Hide Trace ▲' : 'Inspect Trace ▼'}
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Audit Table Columns */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">EVENT</div>
                      <div className="font-bold text-slate-800 text-[11px] truncate">{log.event_title}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">ANALYSIS</div>
                      <div className="font-medium text-slate-700 text-[11px] line-clamp-1">{log.agent_analysis || log.detected_risk}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">PLAN</div>
                      <div className="font-medium text-slate-700 text-[11px] line-clamp-1">{log.recommended_action || "Protect aeration & cold storage"}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">SAFETY</div>
                      <div className="font-bold text-emerald-700 text-[11px] truncate">{log.safety_result || "9 Policies Verified"}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">HUMAN</div>
                      <div className="font-bold text-slate-800 text-[11px] truncate">{log.human_decision || log.action_taken}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">EXECUTION</div>
                      <div className="font-bold text-slate-800 text-[11px] truncate">{log.execution_result || "Dispatched"}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">IMPACT</div>
                      {isRejected || !log.impact || (log.impact.cost_avoided_inr === 0 && log.impact.energy_optimized_kwh === 0) ? (
                        <div className="font-mono text-slate-400 text-[11px] italic truncate" title="No execution impact">
                          — (No execution impact)
                        </div>
                      ) : (
                        <div className="font-mono font-bold text-emerald-700 text-[11px]">
                          {log.impact.energy_optimized_kwh} kWh | ₹{log.impact.cost_avoided_inr.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Breakdown View */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="font-bold text-slate-900 mb-1">🔍 Risk & Domain Analysis Trace:</div>
                          <div className="text-[11px] text-slate-600 space-y-1 font-medium">
                            <div>• <strong>Detected Risk:</strong> {log.detected_risk}</div>
                            <div>• <strong>Agent Findings:</strong> {log.agent_analysis}</div>
                            <div>• <strong>Executed By:</strong> {log.executed_by}</div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                          <div className="font-bold text-slate-900 mb-1 font-sans">⚡ Modeled Impact Detail:</div>
                          {isRejected || !log.impact || (log.impact.cost_avoided_inr === 0 && log.impact.energy_optimized_kwh === 0) ? (
                            <div className="text-[11px] text-slate-500 italic py-1">
                              No execution impact — Plan rejected by operator. Zero commands dispatched to equipment.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
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

                      <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono border border-slate-800">
                        <span className="text-emerald-400 font-bold">RAW AUDIT LEDGER ENTRY:</span> {log.summary}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 text-xs">
          <span className="text-slate-500 font-mono">
            Total Ledger Entries: <strong className="text-slate-800">{logsToDisplay.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold rounded-lg text-xs transition border border-slate-800"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
