import React from 'react';

export type StageId = 'input' | 'agents' | 'orchestrate' | 'plan' | 'safety' | 'approval' | 'execute' | 'impact';

export interface StageConfig {
  id: StageId;
  stepNumber: number;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

export const STAGES: StageConfig[] = [
  { id: 'input', stepNumber: 1, label: 'Synthetic IoT Input', shortLabel: '01 Input', icon: '📡', description: 'Telemetry Scenarios' },
  { id: 'agents', stepNumber: 2, label: 'Multi-Agent Analysis', shortLabel: '02 Agents', icon: '🤖', description: '4 Domain Agents' },
  { id: 'orchestrate', stepNumber: 3, label: 'Priority Orchestration', shortLabel: '03 Orchestrate', icon: '⚡', description: 'AgentShield Synthesis' },
  { id: 'plan', stepNumber: 4, label: 'Synthesized Plan', shortLabel: '04 Plan', icon: '📋', description: 'Protect / Defer / Strategy' },
  { id: 'safety', stepNumber: 5, label: 'Safety Engine Gate', shortLabel: '05 Safety', icon: '🛡️', description: '9 Safety Policies' },
  { id: 'approval', stepNumber: 6, label: 'Human Approval', shortLabel: '06 Approval', icon: '👤', description: 'HITL Decision Console' },
  { id: 'execute', stepNumber: 7, label: 'Digital Twin Execution', shortLabel: '07 Execute', icon: '⚙️', description: 'Simulated Rig Control' },
  { id: 'impact', stepNumber: 8, label: 'Estimated Impact', shortLabel: '08 Impact', icon: '📈', description: 'PoC Savings & ROI' },
];

interface StepperProps {
  currentStage: StageId;
  maxReachedStage: StageId;
  onSelectStage: (stage: StageId) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStage,
  maxReachedStage,
  onSelectStage,
}) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const maxReachedIndex = STAGES.findIndex((s) => s.id === maxReachedStage);

  return (
    <div className="bg-white/90 backdrop-blur-md border border-[#00B8D9]/20 rounded-2xl p-2.5 shadow-card-float shrink-0">
      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none px-1 py-0.5">
        {STAGES.map((stage, idx) => {
          const isCurrent = stage.id === currentStage;
          const isCompleted = idx < maxReachedIndex;
          const isReachable = idx <= maxReachedIndex;

          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                onClick={() => {
                  if (isReachable) onSelectStage(stage.id);
                }}
                disabled={!isReachable}
                title={isReachable ? `${stage.label} — Click to review` : `${stage.label} (Not yet reached)`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#00B8D9] to-[#087EA4] text-white shadow-glow-aqua ring-2 ring-[#00B8D9]/30 scale-[1.02]'
                    : isCompleted
                    ? 'bg-[#EFFBFC] text-[#063B5C] hover:bg-[#E0F7FA] border border-[#00B8D9]/30 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                    isCurrent
                      ? 'bg-white text-[#087EA4]'
                      : isCompleted
                      ? 'bg-[#10B981] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted && !isCurrent ? '✓' : stage.stepNumber}
                </div>
                <div className="flex flex-col text-left">
                  <span className={`text-[11px] leading-tight ${isCurrent ? 'text-white font-extrabold' : ''}`}>
                    {stage.shortLabel}
                  </span>
                </div>
              </button>

              {idx < STAGES.length - 1 && (
                <div
                  className={`h-0.5 w-3 sm:w-5 rounded-full shrink-0 transition-colors ${
                    idx < maxReachedIndex ? 'bg-[#00B8D9]' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
