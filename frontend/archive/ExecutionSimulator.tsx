import React from 'react';

export interface TimelineStep {
  step_number: number;
  timestamp: string;
  title: string;
  detail: string;
  status: 'completed' | 'active' | 'pending';
}

export interface ControlActionLog {
  action: string;
  target_equipment: string;
  previous_state: string;
  new_state: string;
  timestamp: string;
  success: boolean;
  message: string;
}

interface ExecutionSimulatorProps {
  timeline?: TimelineStep[];
  controlActions?: ControlActionLog[];
}

export const ExecutionSimulator: React.FC<ExecutionSimulatorProps> = ({ timeline, controlActions }) => {
  const defaultTimeline: TimelineStep[] = [
    { step_number: 1, timestamp: "14:32:01", title: "Event received", detail: "IoT telemetry signal ingested", status: "completed" },
    { step_number: 2, timestamp: "14:32:02", title: "Agents analyzed", detail: "4 Specialist Agents evaluated domain thresholds", status: "completed" },
    { step_number: 3, timestamp: "14:32:03", title: "Action plan generated", detail: "Orchestrator synthesized unified strategy", status: "completed" },
    { step_number: 4, timestamp: "14:32:04", title: "Safety validation passed", detail: "9 Safety Policies verified and repaired where needed", status: "completed" },
    { step_number: 5, timestamp: "14:32:05", title: "Operator approved", detail: "Operator confirmed simulated command dispatch", status: "completed" },
    { step_number: 6, timestamp: "14:32:06", title: "[SIM] Aerator Soft-Start Commanded", detail: "PoC: Simulated VFD Soft-Start Sequence initiated (0 → 50 Hz ramp)", status: "completed" },
    { step_number: 7, timestamp: "14:32:08", title: "[SIM] Cooling Strategy Applied", detail: "PoC: Simulated Thermal Pre-Cooling Control command issued", status: "completed" },
    { step_number: 8, timestamp: "14:32:09", title: "[SIM] Flexible Loads Deferred", detail: "PoC: Simulated load deferral commands issued to digital models", status: "completed" }
  ];

  const stepsToUse = timeline && timeline.length > 0 ? timeline : defaultTimeline;

  const defaultActions: ControlActionLog[] = [
    { action: "aerator_soft_start", target_equipment: "[SIM] Aerator VFD Soft-Start Controller", previous_state: "Direct-on-Line Mode (18.5 kW Inrush Risk)", new_state: "Simulated VFD Ramp Active (6.4 kW Clamped)", timestamp: "14:32:06", success: true, message: "[PoC] Simulated VFD Soft-Start Sequence initiated. Inrush surge clamped in digital model." },
    { action: "thermal_precooling_control", target_equipment: "[SIM] Cold Storage Compressor Controller", previous_state: "Standard 4.0°C Mode", new_state: "Simulated Thermal Pre-Cooling (1.5°C)", timestamp: "14:32:08", success: true, message: "[PoC] Simulated Thermal Pre-Cooling Control issued. Thermal buffer modelled in cold room mass." },
    { action: "flexible_load_deferral", target_equipment: "[SIM] Ice Plant & Processing Load Controller", previous_state: "Active (7.0 kW total)", new_state: "Simulated Deferral Active (0.0 kW shed)", timestamp: "14:32:09", success: true, message: "[PoC] Simulated load deferral command issued. Battery 20% reserve floor protected in digital model." }
  ];

  const actionsToUse = controlActions && controlActions.length > 0 ? controlActions : defaultActions;

  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 sm:p-6 shadow-card-float space-y-5 my-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              6
            </span>
            <h2 className="text-xl font-extrabold text-[#063B5C]">
              Execution Simulator & Timeline
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            PoC Digital Control Layer — translating operator decisions into simulated control commands. <span className="font-bold text-[#087EA4]">PoC Control Layer</span>.
          </p>
        </div>
        <span className="text-[10px] font-extrabold bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/30 px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
          Simulated Hardware Control
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timeline Column */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
            <span>⏱️</span> Execution Timeline Progress
          </h3>
          <div className="space-y-2.5">
            {stepsToUse.map((step) => (
              <div key={step.step_number} className="flex items-start gap-3 text-xs bg-white p-3 rounded-xl border border-[#00B8D9]/20 shadow-xs">
                <span className="font-mono text-[11px] font-extrabold text-[#087EA4] shrink-0 mt-0.5">
                  {step.timestamp}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0 mt-1 shadow-glow-cyan" />
                <div>
                  <div className="font-extrabold text-[#063B5C]">{step.title}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Control Commands Log Column */}
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <span>🔌</span> Simulated Control Commands Dispatch
            </h3>
            <div className="space-y-3">
              {actionsToUse.map((act, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#00B8D9]/20 shadow-xs text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-extrabold text-[#063B5C]">{act.target_equipment}</span>
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-[#10B981] px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Simulated {act.timestamp}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] flex justify-between my-1.5 font-medium">
                    <span>Previous: <b className="text-[#17324D]">{act.previous_state}</b></span>
                    <span>→</span>
                    <span>New: <b className="text-[#10B981]">{act.new_state}</b></span>
                  </div>
                  <div className="text-[10px] text-[#063B5C] bg-[#EFFBFC] p-2 rounded-lg border border-[#00B8D9]/20 font-medium">
                    {act.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#00B8D9]/20 text-[11px] text-[#64748B] font-semibold text-center">
            ⚠️ PoC Simulation — No physical equipment is controlled. Commands map to real ESP32/VFD/relay targets in next integration stage.
          </div>
        </div>
      </div>
    </div>
  );
};
