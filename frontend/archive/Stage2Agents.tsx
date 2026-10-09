import React, { useState } from 'react';
import { ActionPlan, AgentAnalysis, IoTTelemetry } from '../../types';
import { AgentDetailsModal } from './AgentDetailsModal';

interface Stage2AgentsProps {
  plan: ActionPlan | null;
  telemetry?: IoTTelemetry | null;
  onNext: () => void;
  onBack: () => void;
}

export const Stage2Agents: React.FC<Stage2AgentsProps> = ({
  plan,
  telemetry,
  onNext,
  onBack,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (!plan) {
    return (
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-8 text-center shadow-card-float">
        <div className="w-10 h-10 border-4 border-[#00B8D9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-sm font-extrabold text-[#063B5C]">Specialist Agents Analyzing Telemetry...</div>
      </div>
    );
  }

  // Canonical metrics fallback if plan agent metrics are loading
  const solarKw = telemetry?.solar_gen_kw?.toFixed(1) ?? '4.1';
  const batterySoc = telemetry?.battery_soc_pct?.toFixed(0) ?? '24';
  const pondDo = telemetry?.pond_dissolved_oxygen_mg_l?.toFixed(1) ?? '3.8';
  const waterTemp = telemetry?.pond_water_temp_c?.toFixed(1) ?? '28.4';
  const coldTemp = telemetry?.cold_room_temp_c?.toFixed(1) ?? '4.2';
  const totalLoad = telemetry
    ? ((telemetry.aerators_running * 1.6) + 3.2 + telemetry.pumps_kw + telemetry.ice_plant_kw + telemetry.processing_plant_kw + telemetry.lighting_kw).toFixed(1)
    : '18.3';

  // Helper to format agent badge
  const getAgentStatusBadge = (agentId: string, status: string, riskScore: number) => {
    if (agentId === 'risk') {
      return riskScore >= 40 ? { label: '🔴 HIGH', color: 'bg-rose-100 text-[#EF4444] border-rose-300' } : { label: '✓ LOW', color: 'bg-emerald-100 text-[#10B981] border-emerald-300' };
    }
    if (agentId === 'pond') {
      return status === 'critical' ? { label: '🔴 CRITICAL', color: 'bg-rose-100 text-[#EF4444] border-rose-300' } : { label: '✓ OK', color: 'bg-emerald-100 text-[#10B981] border-emerald-300' };
    }
    if (agentId === 'energy') {
      return status !== 'ok' ? { label: '⚠ CONSTRAINED', color: 'bg-amber-100 text-[#F59E0B] border-amber-300' } : { label: '✓ OK', color: 'bg-emerald-100 text-[#10B981] border-emerald-300' };
    }
    if (agentId === 'cold_chain') {
      return status === 'ok' ? { label: '✓ PROTECTED', color: 'bg-cyan-100 text-[#0096B3] border-cyan-300' } : { label: '⚠ ELEVATED', color: 'bg-amber-100 text-[#F59E0B] border-amber-300' };
    }
    return { label: status.toUpperCase(), color: 'bg-slate-100 text-slate-700 border-slate-300' };
  };

  return (
    <div className="space-y-3">
      {/* Question 2 Anchor: WHAT DID AQUAVOLT FIND? */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 2 of 5: What Did AquaVolt Find?
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          4 specialist agents independently analyze the same event
        </span>
      </div>

      {/* Stage Header */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              02
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              Specialist Agent Domain Analysis
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00B8D9]/10 text-[#087EA4] border border-[#00B8D9]/30 uppercase tracking-wider">
              Single Canonical Telemetry
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Multiple specialist agents independently evaluate the SAME telemetry state to surface biological, electrical, and cold-chain constraints.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#EFFBFC] border border-[#00B8D9]/30 text-[#087EA4] hover:bg-[#E0F7FA] text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>🔍 View Detailed Metrics</span>
          </button>
          <button
            onClick={onNext}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-[#00B8D9] to-[#087EA4] hover:brightness-105 text-white text-xs font-extrabold rounded-xl shadow-glow-aqua transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <span>Orchestrate</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* 4 Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plan.agent_analyses.map((agent) => {
          const badge = getAgentStatusBadge(agent.agent_id, agent.status, plan.risk_score);
          const topFinding = agent.findings[0] || 'Parameters within acceptable operational thresholds.';

          return (
            <div
              key={agent.agent_id}
              className="p-4 rounded-2xl border border-slate-200/90 flex flex-col justify-between shadow-xs hover:shadow-card-float transition duration-150 bg-white"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none">{agent.icon}</span>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wide">
                        {agent.agent_name}
                      </h3>
                      <span className="text-[9px] text-[#64748B] font-mono block">
                        {agent.agent_id === 'pond' && 'Biological Aquaculture Domain'}
                        {agent.agent_id === 'energy' && 'Microgrid Generation & Battery'}
                        {agent.agent_id === 'cold_chain' && 'Perishable Cold Storage'}
                        {agent.agent_id === 'risk' && 'Operational Safety & Policy'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-200/70 mb-2.5">
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#64748B] mb-0.5">
                    Finding:
                  </div>
                  <p className="text-xs text-[#17324D] font-medium leading-relaxed">
                    "{topFinding}"
                  </p>
                </div>
              </div>

              <div>
                {/* Specific canonical metrics tailored per agent */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {agent.agent_id === 'pond' && (
                    <>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        DO: <b className="text-[#063B5C]">{pondDo} mg/L</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Temperature: <b className="text-[#063B5C]">{waterTemp}°C</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Aerators: <b className="text-[#063B5C]">{telemetry?.aerators_running ?? 4}/{telemetry?.aerators_total ?? 4}</b>
                      </span>
                    </>
                  )}
                  {agent.agent_id === 'energy' && (
                    <>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Solar: <b className="text-[#063B5C]">{solarKw} kW</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Battery: <b className="text-[#063B5C]">{batterySoc}%</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Total Load: <b className="text-[#063B5C]">{totalLoad} kW</b>
                      </span>
                    </>
                  )}
                  {agent.agent_id === 'cold_chain' && (
                    <>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Cold Room: <b className="text-[#063B5C]">{coldTemp}°C</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Target Min: <b className="text-[#063B5C]">2.0°C</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Target Max: <b className="text-[#063B5C]">5.0°C</b>
                      </span>
                    </>
                  )}
                  {agent.agent_id === 'risk' && (
                    <>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Operational Risk: <b className={plan.risk_score >= 40 ? 'text-[#EF4444]' : 'text-[#10B981]'}>{plan.risk_score}/100</b>
                      </span>
                      <span className="bg-[#EFFBFC] border border-[#00B8D9]/20 px-2 py-0.5 rounded text-[10px] text-[#64748B] font-semibold">
                        Approval Required: <b className="text-[#063B5C]">{plan.requires_human_approval ? 'YES' : 'NO'}</b>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Convergence Diagram: 4 Agents Converging to Orchestrator */}
      <div className="bg-gradient-to-r from-[#031D2E] via-[#063B5C] to-[#087EA4] text-white rounded-2xl p-3.5 shadow-card-float">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔀</span>
            <div>
              <span className="text-[10px] font-mono text-[#36D7E8] uppercase tracking-wider block font-bold">
                Multi-Agent Synthesis Pipeline
              </span>
              <span className="font-extrabold text-sm">
                Independent Specialist Insights Converge to AquaVolt Orchestrator
              </span>
            </div>
          </div>

          {/* ASCII / Visual Flow */}
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 font-mono text-[11px] text-cyan-200 text-center">
            Pond + Energy + Cold-Chain + Risk ────► [ AQUAVOLT ORCHESTRATOR ]
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-[#64748B] hover:text-[#063B5C] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to IoT Input</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>Proceed to Orchestrator Priority Evaluation</span>
          <span>→</span>
        </button>
      </div>

      <AgentDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        analyses={plan.agent_analyses}
      />
    </div>
  );
};
