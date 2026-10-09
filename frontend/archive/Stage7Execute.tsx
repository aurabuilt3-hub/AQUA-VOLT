import React, { useState, useEffect } from 'react';
import { ActionPlan, ExecutionResult, IoTTelemetry } from '../../types';
import { PS04DigitalTwinModal } from './PS04DigitalTwinModal';

interface Stage7ExecuteProps {
  plan: ActionPlan | null;
  executionResult: ExecutionResult | null;
  telemetry?: IoTTelemetry | null;
  twinState?: any;
  onNext: () => void;
  onBack: () => void;
}

export const Stage7Execute: React.FC<Stage7ExecuteProps> = ({
  plan,
  executionResult,
  telemetry,
  twinState,
  onNext,
  onBack,
}) => {
  const [twinModalOpen, setTwinModalOpen] = useState(false);
  const [showToolDetails, setShowToolDetails] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState<number>(1);

  // Sequential timeline appearance
  useEffect(() => {
    setRevealedSteps(1);
    const intervals = [
      setTimeout(() => setRevealedSteps(2), 200),
      setTimeout(() => setRevealedSteps(3), 400),
      setTimeout(() => setRevealedSteps(4), 600),
      setTimeout(() => setRevealedSteps(5), 800),
      setTimeout(() => setRevealedSteps(6), 1000),
      setTimeout(() => setRevealedSteps(7), 1200),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [plan?.event_id]);

  if (!plan) return null;

  const timelineItems = [
    { id: 1, title: 'IoT telemetry received', detail: 'Telemetry signal ingested from microgrid and pond sensors' },
    { id: 2, title: 'Specialist agents analyzed', detail: 'Pond, Energy, Cold-Chain & Risk agents evaluated thresholds' },
    { id: 3, title: 'Orchestrator generated plan', detail: 'Priority arbitration synthesized unified action plan' },
    { id: 4, title: 'Safety policies validated', detail: '9 deterministic safety checks verified & clamped' },
    { id: 5, title: 'Human approved', detail: 'Demo Operator authorized execution' },
    { id: 6, title: 'Tool Gateway executed', detail: 'Approved tool calls dispatched through controlled API whitelist' },
    { id: 7, title: 'Digital Twin updated', detail: 'Simulated equipment response validated in PS04 model' },
  ];

  const approvedToolCalls = [
    { name: 'startAeratorSoftStart', target: 'Aerator VFD Controller', param: 'ramp: 120s, limit: 1.2x rated (6.4 kW peak)' },
    { name: 'maintainBatteryReserve', target: 'BESS Inverter Controller', param: 'reserve_floor: 20.0%, discharge_cap: 8.0 kW' },
    { name: 'reduceCoolingLoad', target: 'Cold Room Compressor', param: 'mode: thermal_buffer_float, max_hold: 3.5 hrs' },
    { name: 'pauseIceProduction', target: 'Ice Plant Feeder Relay', param: 'shed_duration: 45 min, power_saved: 3.0 kW' },
  ];

  return (
    <div className="space-y-3">
      {/* Question 5 Anchor: WHAT HAPPENED AFTER EXECUTION? */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 5 of 5: What Happened After Execution?
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          Controlled Tool Gateway executes approved commands against the PS04 Digital Twin
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              07
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              Controlled Execution & PS04 Digital Twin
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00B8D9]/10 text-[#087EA4] border border-[#00B8D9]/30 uppercase tracking-wider">
              PoC Control Layer
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              Digital Twin / Simulated Control
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Simulated equipment response for the PoC — verifying real-time VFD ramping, thermal buffering, and microgrid power balance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTwinModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 bg-[#EFFBFC] border border-[#00B8D9]/30 text-[#087EA4] hover:bg-[#E0F7FA] text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>⚙️ Open Full PS04 Twin Console</span>
          </button>
          <button
            onClick={onNext}
            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-[#00B8D9] to-[#087EA4] hover:brightness-105 text-white text-xs font-extrabold rounded-xl shadow-glow-aqua transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <span>View Impact</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Rejection / Cancellation Alert */}
      {executionResult?.status === 'reject' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-[#EF4444] flex items-center gap-3">
          <span className="text-xl">🛑</span>
          <div>
            <div className="font-extrabold text-[#EF4444]">EXECUTION CANCELLED — NO COMMANDS DISPATCHED</div>
            <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
              Operator rejected the proposed plan. Controlled Tool Gateway blocked equipment actuation. PS04 Digital Twin state remains baseline.
            </div>
          </div>
        </div>
      )}

      {/* 10. CONTROLLED TOOL GATEWAY BANNER */}
      <div className="bg-[#EFFBFC] border border-[#00B8D9]/30 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 mb-2.5 border-b border-[#00B8D9]/20 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔌</span>
            <div>
              <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wide">
                CONTROLLED TOOL GATEWAY
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Deterministic execution barrier — only pre-approved and validated tools can be invoked.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowToolDetails(!showToolDetails)}
            className="text-[11px] font-bold text-[#087EA4] hover:text-[#0096B3] bg-white px-3 py-1 rounded-xl border border-[#00B8D9]/30 transition shrink-0"
          >
            {showToolDetails ? 'Hide Technical Details' : '[ View Technical Details ]'}
          </button>
        </div>

        {/* Approved Actions Compact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {approvedToolCalls.map((tool) => (
            <div key={tool.name} className="bg-white p-2.5 rounded-xl border border-[#00B8D9]/20 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1 font-mono text-[11px] font-extrabold text-[#087EA4]">
                <span className="text-[#10B981]">✓</span>
                <span className="truncate">{tool.name}</span>
              </div>
              <div className="text-[10px] text-[#64748B] font-medium truncate">
                {tool.target}
              </div>
              {showToolDetails && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] font-mono text-[#17324D] bg-[#F8FAFC] p-1.5 rounded">
                  {tool.param}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Split: Execution Timeline vs. PS04 Digital Twin Equipment Response */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: Sequential Execution Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-1.5">
                <span>⏱️</span> Execution Timeline
              </h3>
              <span className="text-[10px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {revealedSteps}/7 Sequential Steps
              </span>
            </div>

            <div className="space-y-2">
              {timelineItems.map((item) => {
                const isRevealed = item.id <= revealedSteps;

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all duration-300 text-xs ${
                      isRevealed
                        ? 'bg-[#EFFBFC]/80 border-[#00B8D9]/25 opacity-100 translate-x-0'
                        : 'bg-slate-50 border-slate-200/50 opacity-30 translate-x-1'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isRevealed ? 'bg-[#10B981] text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isRevealed ? '✓' : item.id}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#063B5C] text-xs">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#64748B] font-medium leading-snug">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#087EA4] font-semibold">
            <span>Workflow Sequence: Confirmed</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              Audit Hash Verified
            </span>
          </div>
        </div>

        {/* Right: PS04 DIGITAL TWIN Simulated Equipment Response (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <div>
                <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚙️</span> PS04 DIGITAL TWIN
                </h3>
                <span className="text-[10px] text-[#64748B]">Simulated equipment response</span>
              </div>
              <span className="text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                PoC Simulation
              </span>
            </div>

            {/* PoC Notice Required */}
            <div className="p-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[10px] text-[#64748B] mb-2.5 font-medium flex items-center gap-1.5">
              <span className="text-[#087EA4] font-bold">ℹ️</span>
              <span>PoC simulation — no physical equipment is controlled.</span>
            </div>

            {/* 4 Required Equipment Responses */}
            <div className="space-y-2 text-xs">
              {/* 1. Aerator */}
              <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-[#063B5C] text-xs">Aerator Startup</div>
                  <div className="text-[10px] text-[#64748B]">Inrush surge suppression</div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-[#EF4444] line-through mr-1.5">18.5 kW DOL</span>
                  <span className="text-slate-400">↓</span>
                  <span className="text-[#10B981] font-bold ml-1.5">6.4 kW VFD Soft-Start</span>
                </div>
              </div>

              {/* 2. Cold Storage */}
              <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-[#063B5C] text-xs">Cold Storage</div>
                  <div className="text-[10px] text-[#64748B]">Thermal energy buffering</div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-[#64748B] mr-1.5">Standard refrigeration</span>
                  <span className="text-slate-400">↓</span>
                  <span className="text-[#087EA4] font-bold ml-1.5">Thermal strategy applied (1.5°C)</span>
                </div>
              </div>

              {/* 3. Flexible Loads */}
              <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-[#063B5C] text-xs">Flexible Loads (Ice & Processing)</div>
                  <div className="text-[10px] text-[#64748B]">Demand response shedding</div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-amber-700 mr-1.5">Active (7.0 kW)</span>
                  <span className="text-slate-400">↓</span>
                  <span className="text-amber-600 font-bold ml-1.5">Deferred (0.0 kW shed)</span>
                </div>
              </div>

              {/* 4. Battery */}
              <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-[#063B5C] text-xs">Battery BESS</div>
                  <div className="text-[10px] text-[#64748B]">Reserve preservation</div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-[#64748B] mr-1.5">Normal discharge</span>
                  <span className="text-slate-400">↓</span>
                  <span className="text-purple-700 font-bold ml-1.5">20% reserve protected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-[#64748B] font-mono">
              Twin State: Model Running
            </span>
            <button
              onClick={() => setTwinModalOpen(true)}
              className="text-xs font-bold text-[#087EA4] hover:text-[#0096B3] flex items-center gap-1 underline"
            >
              <span>Inspect Full 3D Facility</span>
              <span>→</span>
            </button>
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
          <span>Back to Human Approval</span>
        </button>

        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>View PoC Estimated Impact & Savings</span>
          <span>→</span>
        </button>
      </div>

      <PS04DigitalTwinModal
        isOpen={twinModalOpen}
        onClose={() => setTwinModalOpen(false)}
        plan={plan}
        telemetry={telemetry}
        twinState={twinState}
      />
    </div>
  );
};
