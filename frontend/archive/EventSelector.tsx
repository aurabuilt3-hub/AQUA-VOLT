import React from 'react';
import { IoTEvent } from '../types';

interface EventSelectorProps {
  events: IoTEvent[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  solar:   { label: 'Solar Energy',    icon: '☀️',  color: 'text-[#087EA4] bg-[#E0F7FA] border-[#00B8D9]/30' },
  battery: { label: 'Battery',         icon: '🔋',  color: 'text-purple-700 bg-purple-50 border-purple-200' },
  oxygen:  { label: 'Pond Oxygen',     icon: '🐟',  color: 'text-blue-700 bg-blue-50 border-blue-200' },
  cold:    { label: 'Cold Storage',    icon: '❄️',  color: 'text-[#0096B3] bg-cyan-50 border-cyan-200' },
  grid:    { label: 'Grid Power',      icon: '⚡',  color: 'text-[#063B5C] bg-slate-100 border-slate-200' },
  temp:    { label: 'Pond Temp',       icon: '🌡️', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  aerator: { label: 'Aerator Motor',   icon: '🌀',  color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
};

const SEVERITY_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  high: { label: 'High Risk',   dot: 'bg-[#EF4444]', badge: 'bg-rose-50 text-[#EF4444] border-rose-200' },
  med:  { label: 'Medium Risk', dot: 'bg-[#F59E0B]', badge: 'bg-amber-50 text-[#F59E0B] border-amber-200' },
  low:  { label: 'Auto-Safe',   dot: 'bg-[#10B981]', badge: 'bg-emerald-50 text-[#10B981] border-emerald-200' },
};

function getEventSnapshot(event: IoTEvent): string {
  const m = event?.relevant_measurements || {};
  switch (event.id) {
    case 'SOLAR_DROP_60':        return `☀️ Solar: ${m.solar_kw ?? '4.1'} kW · 🔋 Battery: ${m.battery_soc ?? '38'}%`;
    case 'BATTERY_LOW_20':       return `🔋 Battery: ${m.battery_soc ?? '18'}% · ⚡ Grid: Offline`;
    case 'POND_DO_FALLING':      return `🐟 O₂: ${m.pond_do ?? '2.9'} mg/L · ⚠️ Below safe limit`;
    case 'COLD_ROOM_TEMP_RISING':return `❄️ Cold room: ${m.cold_room_temp ?? '6.2'}°C · Limit: 5.0°C`;
    case 'GRID_FAILURE':         return `⚡ Grid: Offline · 🔋 Battery: ${m.battery_soc ?? '62'}%`;
    case 'POND_TEMP_HIGH':       return `🌡️ Pond: ${m.pond_water_temp ?? '30.5'}°C · Threshold: 29.5°C`;
    case 'AERATOR_START_REQUESTED': return `🌀 Inrush risk: ${m.potential_inrush_kw ?? '16.2'} kW · VFD ready`;
    case 'SOLAR_NORMAL':         return `☀️ Solar: ${m.solar_kw ?? '18.4'} kW · Pre-cooling window`;
    case 'BATTERY_HEALTHY':      return `🔋 Battery: ${m.battery_soc ?? '82'}% · All systems normal`;
    case 'COLD_CHAIN_STABLE':    return `❄️ Cold room: ${m.cold_room_temp ?? '3.8'}°C · Product safe`;
    default:
      return event?.description ? event.description.slice(0, 60) : 'Operational event telemetry';
  }
}

export const EventSelector: React.FC<EventSelectorProps> = ({ events = [], selectedEventId, onSelectEvent }) => {
  const highEvents = (events || []).filter(e => e.severity === 'high');
  const otherEvents = (events || []).filter(e => e.severity !== 'high');

  const renderCard = (event: IoTEvent) => {
    const isSelected = event.id.toUpperCase() === selectedEventId.toUpperCase();
    const sevCfg = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low;
    const catCfg = CATEGORY_LABELS[event.category] ?? { label: event.category, icon: '📡', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    const displayName = event.name;
    const snapshot = getEventSnapshot(event);
    const needsApproval = event.severity === 'high';

    return (
      <button
        key={event.id}
        onClick={() => onSelectEvent(event.id)}
        className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 transform ${
          isSelected
            ? 'border-[#00B8D9] bg-[#EFFBFC] shadow-glow-aqua ring-2 ring-[#00B8D9]/40 scale-[1.01]'
            : 'border-slate-200 hover:border-[#00B8D9]/40 hover:bg-slate-50/80 bg-white shadow-xs'
        }`}
        title={event.description}
      >
        {/* Top Row: Icon + Event Title + Severity Badge */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl select-none shrink-0">{event.icon}</span>
            <span className="text-xs font-extrabold text-[#063B5C] leading-snug truncate">{displayName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${sevCfg.dot} shrink-0`} />
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${sevCfg.badge}`}>
              {sevCfg.label}
            </span>
          </div>
        </div>

        {/* Second Row: Category & HITL Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${catCfg.color}`}>
            {catCfg.icon} {catCfg.label}
          </span>
          {needsApproval ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-[#EF4444] border border-rose-200 uppercase tracking-wide">
              👤 Approval Required
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-[#10B981] border border-emerald-200 uppercase tracking-wide">
              ✓ Auto-Safe
            </span>
          )}
        </div>

        {/* Snapshot metric */}
        <p className="text-[11px] text-[#64748B] font-medium leading-relaxed">{snapshot}</p>

        {/* Selected Active Bar Indicator */}
        {isSelected && (
          <div className="mt-2.5 pt-2 border-t border-[#00B8D9]/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00B8D9] animate-pulse" />
            <span className="text-[10px] font-extrabold text-[#087EA4] uppercase tracking-wide">
              Active Scenario — Ingesting Telemetry
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 shadow-card-float h-full flex flex-col">
      {/* Title Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
          1
        </span>
        <h2 className="text-lg font-extrabold text-[#063B5C]">Incoming IoT Event</h2>
      </div>
      <p className="text-xs text-[#64748B] mb-3.5 pl-9 font-medium">
        Select a field event to simulate real-world conditions (10 scenarios).
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-2.5 mb-3.5 pl-0.5">
        <span className="text-[10px] font-bold text-[#64748B] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> High — Requires Approval
        </span>
        <span className="text-[10px] font-bold text-[#64748B] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Medium
        </span>
        <span className="text-[10px] font-bold text-[#64748B] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Normal — Auto-Safe
        </span>
      </div>

      {/* Scenarios List */}
      <div className="space-y-2 overflow-y-auto flex-1 pr-1" style={{ maxHeight: '520px' }}>
        {highEvents.length > 0 && (
          <>
            <div className="text-[10px] font-extrabold text-[#EF4444] uppercase tracking-widest px-1 pt-1 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              Critical Events — Operator Approval Gate ({highEvents.length})
            </div>
            {highEvents.map(renderCard)}
          </>
        )}

        {otherEvents.length > 0 && (
          <>
            <div className="text-[10px] font-extrabold text-[#087EA4] uppercase tracking-widest px-1 pt-3 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Standard Scenarios — Auto-Optimizable ({otherEvents.length})
            </div>
            {otherEvents.map(renderCard)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-[#64748B] text-center font-bold">
        {events.length} of 10 IoT scenarios loaded
        {events.length === 10 && <span className="ml-1 text-[#10B981]">✓ All available</span>}
      </div>
    </div>
  );
};
