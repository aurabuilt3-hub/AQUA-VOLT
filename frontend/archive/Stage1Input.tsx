import React, { useState } from 'react';
import { IoTEvent, IoTTelemetry } from '../../types';

interface Stage1InputProps {
  events: IoTEvent[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  onProcessInput: () => void;
  loading: boolean;
  telemetry?: IoTTelemetry | null;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  solar:   { label: 'Solar Energy',  icon: '☀️', color: 'text-[#087EA4] bg-[#E0F7FA] border-[#00B8D9]/30' },
  battery: { label: 'Battery BESS',  icon: '🔋', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  oxygen:  { label: 'Pond Oxygen',   icon: '🐟', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  cold:    { label: 'Cold Storage',  icon: '❄️', color: 'text-[#0096B3] bg-cyan-50 border-cyan-200' },
  grid:    { label: 'Grid Power',    icon: '⚡', color: 'text-[#063B5C] bg-slate-100 border-slate-200' },
  temp:    { label: 'Pond Temp',     icon: '🌡️', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  aerator: { label: 'Aerator Rig',   icon: '🌀', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
};

const SEVERITY_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  high: { label: 'High Risk', dot: 'bg-[#EF4444]', badge: 'bg-rose-50 text-[#EF4444] border-rose-200' },
  med:  { label: 'Medium Risk', dot: 'bg-[#F59E0B]', badge: 'bg-amber-50 text-[#F59E0B] border-amber-200' },
  low:  { label: 'Auto-Safe', dot: 'bg-[#10B981]', badge: 'bg-emerald-50 text-[#10B981] border-emerald-200' },
};

export const Stage1Input: React.FC<Stage1InputProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onProcessInput,
  loading,
  telemetry,
}) => {
  const [ingestionStep, setIngestionStep] = useState<number | null>(null);

  const selectedEvent =
    events.find((e) => e.id.toUpperCase() === selectedEventId.toUpperCase()) || events[0];

  const currentTel = telemetry || selectedEvent?.telemetry;

  // Calculate canonical total load
  const totalLoadKw =
    selectedEvent?.energy_state?.total_load_kw ??
    (currentTel
      ? (currentTel.aerators_running * 1.6) + 3.2 + currentTel.pumps_kw + currentTel.ice_plant_kw + currentTel.processing_plant_kw + currentTel.lighting_kw
      : 18.3);

  const handleStartProcessing = () => {
    if (loading || ingestionStep !== null) return;
    setIngestionStep(1); // IoT Telemetry Received ✓

    setTimeout(() => {
      setIngestionStep(2); // Context State Created ✓
    }, 320);

    setTimeout(() => {
      setIngestionStep(3); // Routing to Specialist Agents...
    }, 650);

    setTimeout(() => {
      setIngestionStep(null);
      onProcessInput();
    }, 1000);
  };

  return (
    <div className="space-y-3">
      {/* Question 1 Anchor: WHAT HAPPENED? */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 1 of 5: What Happened?
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          IoT sensor network detects operational boundary shift
        </span>
      </div>

      {/* Stage Header */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
                01
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
                Synthetic IoT Inputs
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00B8D9]/10 text-[#087EA4] border border-[#00B8D9]/30 uppercase tracking-wider">
                10 Scenarios Prepared
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-medium max-w-4xl">
              Representative telemetry scenarios prepared to demonstrate how AquaVolt responds to real-world aquaculture and cold-chain operating conditions.
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={handleStartProcessing}
              disabled={loading || ingestionStep !== null}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#00B8D9] via-[#087EA4] to-[#063B5C] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-glow-aqua flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wider disabled:opacity-75"
            >
              {ingestionStep !== null ? (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {ingestionStep === 1 && 'IoT Telemetry Received ✓'}
                    {ingestionStep === 2 && 'Context State Created ✓'}
                    {ingestionStep === 3 && 'Routing to Specialist Agents...'}
                  </span>
                </div>
              ) : (
                <>
                  <span>⚡ PROCESS IoT INPUT</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Small PoC Telemetry Explanation */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-[#64748B]">
          <span className="text-[#00B8D9] font-bold">ℹ️ Note:</span>
          <span>
            These inputs represent synthetic telemetry that could typically be received from field IoT devices. They are used for the PoC demonstration.
          </span>
        </div>
      </div>

      {/* Main Content: Split 10-Inputs Grid & Live Snapshot Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: 10 Synthetic IoT Inputs Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] px-1">
            <span>CHOOSE REPRESENTATIVE TELEMETRY SCENARIO</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">
              10 Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pr-1">
            {events.map((event) => {
              const isSelected = event.id.toUpperCase() === selectedEventId.toUpperCase();
              const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.low;
              const cat = CATEGORY_META[event.category] || { label: event.category, icon: '📡', color: 'text-slate-600 bg-slate-50 border-slate-200' };

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                  className={`text-left p-3 rounded-xl border transition-all duration-150 relative ${
                    isSelected
                      ? 'border-[#00B8D9] bg-[#EFFBFC] shadow-glow-aqua ring-2 ring-[#00B8D9]/40 translate-y-[-1px]'
                      : 'border-slate-200 bg-white hover:border-[#00B8D9]/30 hover:bg-slate-50/60 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base select-none shrink-0">{event.icon}</span>
                      <span className="text-xs font-extrabold text-[#063B5C] truncate">
                        {event.name}
                      </span>
                    </div>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${sev.badge}`}>
                      {sev.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${cat.color}`}>
                      {cat.icon} {cat.label}
                    </span>
                    {event.severity === 'high' ? (
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-[#EF4444] border border-rose-200">
                        APPROVAL REQ
                      </span>
                    ) : (
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-[#10B981] border border-emerald-200">
                        AUTO-SAFE
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-[#64748B] line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {isSelected && (
                    <div className="absolute right-2 bottom-1.5 text-[#00B8D9] text-[10px] font-extrabold flex items-center gap-1">
                      <span>Selected</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B8D9] animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Input Preview & Telemetry Snapshot (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-2">
          {selectedEvent && (
            <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedEvent.icon}</span>
                    <div>
                      <span className="text-[9px] font-mono text-[#087EA4] uppercase tracking-wider block font-bold">
                        Incoming IoT Event
                      </span>
                      <h3 className="text-sm font-extrabold text-[#063B5C]">
                        {selectedEvent.name}
                      </h3>
                    </div>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    SEVERITY_CONFIG[selectedEvent.severity]?.badge || 'bg-slate-100'
                  }`}>
                    {selectedEvent.severity.toUpperCase()} RISK
                  </span>
                </div>

                <p className="text-xs text-[#17324D] leading-relaxed mb-3 bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-200">
                  {selectedEvent.description}
                </p>

                {/* Canonical Telemetry Snapshot: Solar, Battery, Grid, Pond DO, Cold Room, Load */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#063B5C] uppercase tracking-wider">
                    Canonical Telemetry Snapshot
                  </span>
                  <span className="text-[9px] font-mono text-[#10B981] font-bold">
                    ● Real-Time Feed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                    <div className="text-[9px] text-[#64748B] font-semibold uppercase">Solar Generation</div>
                    <div className="text-sm font-extrabold text-[#063B5C] mt-0.5">
                      {currentTel?.solar_gen_kw?.toFixed(1) ?? '4.1'} kW
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                    <div className="text-[9px] text-[#64748B] font-semibold uppercase">Battery SOC</div>
                    <div className="text-sm font-extrabold text-[#063B5C] mt-0.5">
                      {currentTel?.battery_soc_pct?.toFixed(0) ?? '24'}%
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                    <div className="text-[9px] text-[#64748B] font-semibold uppercase">Grid Status</div>
                    <div className="text-xs font-extrabold text-[#063B5C] mt-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${currentTel?.grid_available ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                      {currentTel?.grid_available ? 'Available' : 'Offline'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                    <div className="text-[9px] text-[#64748B] font-semibold uppercase">Pond Dissolved O₂</div>
                    <div className="text-sm font-extrabold text-[#063B5C] mt-0.5">
                      {currentTel?.pond_dissolved_oxygen_mg_l?.toFixed(1) ?? '3.8'} mg/L
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                    <div className="text-[9px] text-[#64748B] font-semibold uppercase">Cold Room Temp</div>
                    <div className="text-sm font-extrabold text-[#063B5C] mt-0.5">
                      {currentTel?.cold_room_temp_c?.toFixed(1) ?? '4.2'}°C
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#EFFBFC] rounded-xl border border-[#00B8D9]/20">
                    <div className="text-[9px] text-[#64748B] font-semibold uppercase">Total Facility Load</div>
                    <div className="text-sm font-extrabold text-[#063B5C] mt-0.5">
                      {totalLoadKw.toFixed(1)} kW
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingestion Animation callout / button */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-[#64748B] font-medium">
                  {ingestionStep !== null ? 'Routing telemetry to agents...' : 'Ready for multi-agent evaluation'}
                </span>
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  disabled={loading || ingestionStep !== null}
                  className="px-4 py-1.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-75"
                >
                  {ingestionStep !== null ? (
                    <span>Routing...</span>
                  ) : (
                    <>
                      <span>Process Input</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
