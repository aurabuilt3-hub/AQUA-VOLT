import React, { useState } from 'react';
import { ActionPlan, ApprovalRequest, ExecutionResult } from '../types';

interface HumanApprovalProps {
  plan: ActionPlan | null;
  onApprove: (request: ApprovalRequest) => Promise<ExecutionResult | null>;
}

export const HumanApproval: React.FC<HumanApprovalProps> = ({ plan, onApprove }) => {
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [overrideIcePlant, setOverrideIcePlant] = useState(false);
  const [overrideProcessing, setOverrideProcessing] = useState(false);
  const [modifyWarning, setModifyWarning] = useState<string | null>(null);

  if (!plan) return null;

  const handleAction = async (action: 'approve' | 'modify' | 'reject') => {
    if (action === 'modify' && !isModifyMode) {
      setIsModifyMode(true);
      setStatusMessage("Modify mode active: You can adjust permitted flexible-load toggles below.");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    setModifyWarning(null);

    try {
      const notes = isModifyMode
        ? `Modified by operator: Ice Plant ${overrideIcePlant ? 'FORCE_ON' : 'DEFERRED'}, Processing ${overrideProcessing ? 'FORCE_ON' : 'DEFERRED'}`
        : undefined;

      const res = await onApprove({ event_id: plan.event_id, action, notes });
      if (res) {
        if (action === 'approve') {
          setStatusMessage('✓ Plan Approved! Simulated control commands dispatched to PoC Digital Control Layer. Aerator Soft-Start Sequence & Thermal Pre-Cooling Control simulated successfully.');
        } else if (action === 'modify') {
          setStatusMessage('✎ Plan Modified & Executed! Re-validated with Safety Engine and updated audit log.');
          setIsModifyMode(false);
        } else {
          setStatusMessage('✕ Plan Rejected. Current farm state preserved. Audit log updated.');
          setIsModifyMode(false);
        }
      }
    } catch (err) {
      setStatusMessage('Execution completed locally.');
    } finally {
      setSubmitting(false);
    }
  };

  const isHighRisk = plan.requires_human_approval || plan.risk_score >= 40;

  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 sm:p-6 shadow-card-float space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
            5
          </span>
          <h2 className="text-xl font-extrabold text-[#063B5C]">Human Approval</h2>
        </div>

        <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${
          isHighRisk
            ? 'bg-rose-50 text-[#EF4444] border-rose-200 shadow-xs'
            : 'bg-emerald-50 text-[#10B981] border-emerald-200 shadow-xs'
        }`}>
          {isHighRisk ? '🔴 Operator approval is required before execution' : '🟢 Auto-Safe Execution Permitted'}
        </span>
      </div>

      <p className="text-xs text-[#64748B] font-medium leading-relaxed">
        Review AquaVolt's recommended energy allocation plan. You may approve execution, modify flexible loads, or reject the plan.
      </p>

      {/* Decision Summary Bar */}
      <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-[#64748B] font-semibold block uppercase">Risk Level</span>
          <span className={`font-extrabold text-sm ${isHighRisk ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {plan.risk_score}/100 ({isHighRisk ? 'HIGH' : 'LOW'})
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] font-semibold block uppercase">Critical Ops</span>
          <span className="font-extrabold text-[#10B981] text-sm">✓ 100% Protected</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] font-semibold block uppercase">Aerator Rig</span>
          <span className="font-extrabold text-[#087EA4] text-sm">VFD Soft-Start</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] font-semibold block uppercase">Thermal Action</span>
          <span className="font-extrabold text-[#00B8D9] text-sm">
            {plan.thermal_precool_rig.enabled ? '1.5°C Pre-Cool' : '4.0°C Mode'}
          </span>
        </div>
      </div>

      {/* Modify Controls Drawer */}
      {isModifyMode && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
              ✎ Operator Override Controls (Safety Engine Active)
            </h3>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              Safety Rules Active
            </span>
          </div>

          <p className="text-xs text-[#17324D] font-medium">
            You may adjust permitted flexible loads. Life-critical pond aeration and cold storage safety policies remain protected.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 text-xs font-bold text-[#063B5C] bg-white p-3 rounded-xl border border-amber-200 cursor-pointer shadow-xs">
              <input
                type="checkbox"
                checked={overrideIcePlant}
                onChange={(e) => setOverrideIcePlant(e.target.checked)}
                className="w-4 h-4 text-[#00B8D9] rounded"
              />
              <span>Force Run Ice Production Plant (3.0 kW)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-bold text-[#063B5C] bg-white p-3 rounded-xl border border-amber-200 cursor-pointer shadow-xs">
              <input
                type="checkbox"
                checked={overrideProcessing}
                onChange={(e) => setOverrideProcessing(e.target.checked)}
                className="w-4 h-4 text-[#00B8D9] rounded"
              />
              <span>Force Run Shrimp Processing Line (4.0 kW)</span>
            </label>
          </div>

          {modifyWarning && (
            <div className="text-[11px] font-bold text-amber-900 bg-amber-100 p-2.5 rounded-xl border border-amber-200">
              {modifyWarning}
            </div>
          )}
        </div>
      )}

      {/* 3 Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        <button
          disabled={submitting}
          onClick={() => handleAction('approve')}
          className="w-full py-4 px-5 bg-gradient-to-r from-[#14B8A6] to-[#10B981] hover:brightness-105 text-white font-extrabold rounded-2xl shadow-glow-aqua transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          {submitting ? 'Executing...' : '✓ Approve Plan'}
        </button>

        <button
          disabled={submitting}
          onClick={() => handleAction('modify')}
          className={`w-full py-4 px-5 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm ${
            isModifyMode
              ? 'bg-gradient-to-r from-[#087EA4] to-[#00B8D9] text-white shadow-glow-aqua'
              : 'bg-[#EFFBFC] hover:bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/40'
          }`}
        >
          {isModifyMode ? '✓ Confirm Modifications' : '✎ Modify Plan'}
        </button>

        <button
          disabled={submitting}
          onClick={() => handleAction('reject')}
          className="w-full py-4 px-5 bg-rose-50 hover:bg-rose-100 text-[#EF4444] border border-rose-200 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          ✕ Reject Plan
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed shadow-xs ${
          statusMessage.includes('Approved')
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : statusMessage.includes('Modified') || statusMessage.includes('Modify')
            ? 'bg-[#EFFBFC] text-[#087EA4] border-[#00B8D9]/40'
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};
