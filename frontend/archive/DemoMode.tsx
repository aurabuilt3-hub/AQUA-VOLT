import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface DemoStep {
  id: number;
  phase: string;        // "Signal" / "Analysis" / "Decision" / "Execution" / "Result"
  title: string;
  subtitle: string;
  icon: string;
  content: React.ReactNode;
}

interface DemoModeProps {
  onClose: () => void;
}

// ─── SOLAR_DROP_60 scenario data ─────────────────────────────────────────────
const SCENARIO = {
  event: {
    id: 'SOLAR_DROP_60',
    name: 'Solar generation dropped 60%',
    time: '14:32:01',
    solar_kw: 4.1,
    solar_before: 18.4,
    battery_soc: 38,
    pond_do: 4.2,
    cold_temp: 4.3,
    total_load: 18.3,
    grid: true,
    aerators_on: 4,
    inrush_kw: 0,
    thermal_buffer: 2.5,
  },
};

// ─── Reusable mini-components ────────────────────────────────────────────────

const PocBadge: React.FC = () => (
  <span className="inline-block text-[9px] font-extrabold bg-slate-800 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-widest">
    PoC Simulation
  </span>
);

const MetricPill: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = 'bg-slate-100 text-slate-700' }) => (
  <div className={`flex items-center justify-between gap-4 px-3 py-2 rounded-xl ${color}`}>
    <span className="text-[11px] text-slate-500 font-medium">{label}</span>
    <span className="text-sm font-extrabold">{value}</span>
  </div>
);

const AgentCard: React.FC<{
  icon: string; name: string; status: 'ok' | 'warning' | 'critical'; finding: string; metric: string;
}> = ({ icon, name, status, finding, metric }) => {
  const statusCfg = {
    ok:       { dot: 'bg-emerald-500', label: 'OK',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warning:  { dot: 'bg-amber-500',   label: 'WARNING',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    critical: { dot: 'bg-rose-500',    label: 'CRITICAL', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[status];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
      <span className="text-2xl select-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-800 truncate">{name}</span>
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${statusCfg.badge}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusCfg.dot} mr-1`} />
            {statusCfg.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{finding}</p>
        <p className="text-[10px] font-bold text-slate-700 mt-1">{metric}</p>
      </div>
    </div>
  );
};

const TimelineRow: React.FC<{ time: string; label: string; detail: string; active?: boolean; poc?: boolean }> = ({
  time, label, detail, active, poc
}) => (
  <div className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${active ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
    <span className="font-mono text-[11px] text-slate-400 shrink-0 mt-0.5 w-14">{time}</span>
    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-bold ${active ? 'text-emerald-800' : 'text-slate-700'}`}>{label}</span>
        {poc && <PocBadge />}
      </div>
      <p className="text-[11px] text-slate-500 mt-0.5">{detail}</p>
    </div>
  </div>
);

const ResultCard: React.FC<{ icon: string; title: string; value: string; sub: string; color: string }> = ({
  icon, title, value, sub, color
}) => (
  <div className={`rounded-2xl border p-4 flex flex-col gap-1 ${color}`}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{title}</span>
    </div>
    <div className="text-2xl font-extrabold text-[#10233f]">{value}</div>
    <div className="text-[11px] text-slate-500">{sub}</div>
  </div>
);

// ─── Step content definitions ─────────────────────────────────────────────────

function buildSteps(): DemoStep[] {
  const s = SCENARIO.event;

  return [
    // ── STEP 1 ─────────────────────────────────────────────────────────────
    {
      id: 1, phase: 'Signal', icon: '📡',
      title: 'IoT Event Received',
      subtitle: 'Solar generation dropped 60% — AquaVolt detects a critical telemetry change',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">☀️</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-rose-800">Solar generation dropped 60%</h3>
                  <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-full uppercase">HIGH SEVERITY</span>
                </div>
                <p className="text-xs text-rose-600 mt-1">Visakhapatnam Hatchery · {s.time} · Event ID: SOLAR_DROP_60</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Solar Before', v: '18.4 kW', c: 'bg-white text-slate-700' },
                { l: 'Solar Now', v: '4.1 kW', c: 'bg-rose-100 text-rose-800' },
                { l: 'Drop', v: '−60%', c: 'bg-rose-200 text-rose-900' },
                { l: 'Load Demand', v: '18.3 kW', c: 'bg-amber-100 text-amber-800' },
              ].map(m => (
                <div key={m.l} className={`rounded-xl p-3 text-center ${m.c}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wide opacity-60">{m.l}</div>
                  <div className="text-xl font-extrabold mt-0.5">{m.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">What this means in plain language</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Sudden cloud cover reduced solar output from <strong>18.4 kW → 4.1 kW</strong>.
              The hatchery was producing more energy than it's now receiving.
              Without intervention, the battery will drain and aerators could trip — risking the shrimp stock.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span className="text-blue-500 text-lg">🔔</span>
            <span className="text-xs font-semibold text-blue-700">AquaVolt received this telemetry signal and immediately began analysis.</span>
          </div>
        </div>
      )
    },

    // ── STEP 2 ─────────────────────────────────────────────────────────────
    {
      id: 2, phase: 'Signal', icon: '📊',
      title: 'Farm Telemetry Loaded',
      subtitle: 'AquaVolt reads the full farm state across all domains',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: '⚡ Energy System', color: 'border-amber-200 bg-amber-50',
              rows: [
                { l: 'Solar Generation', v: `${s.solar_kw} kW  ⬇ (was 18.4)`, c: 'bg-rose-100 text-rose-800' },
                { l: 'Battery SOC', v: `${s.battery_soc}%`, c: 'bg-amber-100 text-amber-800' },
                { l: 'Grid Power', v: 'Connected ✓', c: 'bg-emerald-50 text-emerald-700' },
                { l: 'Total Load', v: `${s.total_load} kW`, c: 'bg-slate-100 text-slate-700' },
              ]
            },
            {
              title: '🐟 Pond Health', color: 'border-blue-200 bg-blue-50',
              rows: [
                { l: 'Dissolved Oxygen', v: `${s.pond_do} mg/L (↓ falling)`, c: 'bg-amber-100 text-amber-800' },
                { l: 'Water Temperature', v: '28.1°C', c: 'bg-slate-100 text-slate-700' },
                { l: 'Aerators Running', v: `${s.aerators_on}/4 Active`, c: 'bg-emerald-50 text-emerald-700' },
                { l: 'Soft-Start Active', v: '✓ VFD Rig Ready', c: 'bg-blue-50 text-blue-700' },
              ]
            },
            {
              title: '❄️ Cold Storage', color: 'border-cyan-200 bg-cyan-50',
              rows: [
                { l: 'Cold Room Temp', v: `${s.cold_temp}°C (target: ≤5°C)`, c: 'bg-emerald-50 text-emerald-700' },
                { l: 'Thermal Buffer', v: `${s.thermal_buffer} hours`, c: 'bg-slate-100 text-slate-700' },
                { l: 'Pre-Cooling', v: 'Standby', c: 'bg-slate-100 text-slate-700' },
                { l: 'Product Status', v: '2.8 tons Shrimp ✓', c: 'bg-emerald-50 text-emerald-700' },
              ]
            },
            {
              title: '🔋 Battery & Grid', color: 'border-purple-200 bg-purple-50',
              rows: [
                { l: 'Battery Health', v: '95% ✓', c: 'bg-emerald-50 text-emerald-700' },
                { l: 'Reserve Floor', v: '20% (policy minimum)', c: 'bg-purple-100 text-purple-800' },
                { l: 'Usable Reserve', v: '~8.4 kWh', c: 'bg-slate-100 text-slate-700' },
                { l: 'Grid Backup', v: 'Available (standby)', c: 'bg-slate-100 text-slate-700' },
              ]
            },
          ].map(section => (
            <div key={section.title} className={`border rounded-xl p-3 ${section.color}`}>
              <div className="text-xs font-extrabold text-slate-700 mb-2">{section.title}</div>
              <div className="space-y-1.5">
                {section.rows.map(r => (
                  <MetricPill key={r.l} label={r.l} value={r.v} color={r.c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    },

    // ── STEP 3 ─────────────────────────────────────────────────────────────
    {
      id: 3, phase: 'Analysis', icon: '🐟',
      title: 'Pond Agent Analyzes',
      subtitle: 'Dissolved oxygen trend & aerator soft-start decision',
      content: (
        <div className="space-y-4">
          <AgentCard icon="🐟" name="Pond Health & Aerator Specialist" status="warning"
            finding={`Dissolved Oxygen: 4.2 mg/L (threshold: 4.0 mg/L — FALLING TREND ⬇). Aerator Soft-Start Rig is active. All 4 aerators must remain ON. VFD ramp prevents 350% inrush surge.`}
            metric="DO: 4.2 mg/L · Aerators: 4/4 · Inrush clamped: 18.5→6.4 kW" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-amber-800">4.2</div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">DO mg/L</div>
              <div className="text-[10px] text-amber-500 mt-0.5">↓ Falling — Watch closely</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-rose-800">3.5</div>
              <div className="text-[10px] font-bold text-rose-600 uppercase">Critical Floor mg/L</div>
              <div className="text-[10px] text-rose-500 mt-0.5">Below this = shrimp at risk</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-emerald-800">4/4</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Aerators Active</div>
              <div className="text-[10px] text-emerald-500 mt-0.5">Locked ON — critical load</div>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide mb-1.5">🌀 Soft-Start Rig Decision</div>
            <p className="text-xs text-indigo-800">
              Direct-On-Line startup would draw <strong>18.5 kW inrush</strong>. Pond Agent recommends
              VFD frequency ramp: <strong>0 → 50 Hz over 120 seconds</strong>, motors staggered every 30s.
              Peak clamped to <strong>6.4 kW</strong>.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Agent Verdict</p>
            <p className="text-sm font-semibold text-amber-700">⚠️ Warning — DO trending down. Aeration is CRITICAL. Cannot be deferred under any energy strategy.</p>
          </div>
        </div>
      )
    },

    // ── STEP 4 ─────────────────────────────────────────────────────────────
    {
      id: 4, phase: 'Analysis', icon: '⚡',
      title: 'Energy Agent Analyzes',
      subtitle: 'Solar–battery–grid balance calculation',
      content: (
        <div className="space-y-4">
          <AgentCard icon="⚡" name="Energy & Microgrid Specialist" status="warning"
            finding="Solar: 4.1 kW. Total load: 18.3 kW. Energy deficit: 14.2 kW. Battery SOC: 38% — above 20% floor. Grid connected but in standby. Battery can cover deficit for ~45 minutes at current draw rate."
            metric="Deficit: 14.2 kW · Battery runway: ~45 min · Grid: Standby" />
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-3">Energy Balance</div>
            <div className="space-y-2">
              {[
                { label: 'Solar Supply', value: 4.1, max: 18.4, color: 'bg-amber-400', unit: 'kW' },
                { label: 'Total Demand', value: 18.3, max: 22, color: 'bg-rose-400', unit: 'kW' },
                { label: 'Battery SOC', value: 38, max: 100, color: 'bg-purple-400', unit: '%' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>{bar.label}</span><span>{bar.value} {bar.unit}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${bar.color}`}
                      style={{ width: `${(bar.value / bar.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-rose-600 uppercase mb-1">Energy Deficit</div>
              <div className="text-2xl font-extrabold text-rose-800">−14.2 kW</div>
              <div className="text-[11px] text-rose-600 mt-1">Must shed flexible loads immediately</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Safe Actions</div>
              <div className="text-xs font-semibold text-emerald-800 mt-1">
                ✓ Battery discharge (above 20% floor)<br />
                ✓ Grid standby available<br />
                ✓ Defer 7 kW flexible loads
              </div>
            </div>
          </div>
        </div>
      )
    },

    // ── STEP 5 ─────────────────────────────────────────────────────────────
    {
      id: 5, phase: 'Analysis', icon: '❄️',
      title: 'Cold Chain Agent Analyzes',
      subtitle: 'Cold storage safety & thermal buffer assessment',
      content: (
        <div className="space-y-4">
          <AgentCard icon="❄️" name="Cold Storage & Thermal Pre-Cooling Specialist" status="ok"
            finding={`Cold room temperature is ${s.cold_temp}°C — within safe 2°C–5°C range. Thermal buffer provides 2.5 hours of passive cooling. Solar is too low (4.1 kW) to activate thermal pre-cooling window. Standard refrigeration mode.`}
            metric={`Temp: ${s.cold_temp}°C · Buffer: ${s.thermal_buffer}h · Mode: Standard 4.0°C`} />
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
            <div className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wide mb-3">Cold Room Status</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-extrabold text-cyan-800">{s.cold_temp}°C</div>
                <div className="text-[10px] text-cyan-600">Current Temp</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-700">5.0°C</div>
                <div className="text-[10px] text-emerald-600">Safety Limit</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-blue-700">{s.thermal_buffer}h</div>
                <div className="text-[10px] text-blue-600">Thermal Buffer</div>
              </div>
            </div>
            <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full" style={{ width: '86%' }} />
              <div className="absolute top-0 h-full border-r-2 border-rose-500 border-dashed" style={{ left: '100%' }} title="Max limit" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>0°C</span><span className="text-emerald-600">✓ Safe Zone</span><span>5°C limit</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Agent Verdict</p>
            <p className="text-sm font-semibold text-emerald-700">✓ Cold chain is safe. Refrigeration must stay ON. Thermal buffer provides 2.5h passive safety window if compressor cycles.</p>
          </div>
        </div>
      )
    },

    // ── STEP 6 ─────────────────────────────────────────────────────────────
    {
      id: 6, phase: 'Analysis', icon: '🛡️',
      title: 'Risk Agent Analyzes',
      subtitle: 'Operational risk score calculated across all domains',
      content: (
        <div className="space-y-4">
          <AgentCard icon="🛡️" name="Operational & Safety Risk Specialist" status="critical"
            finding="Event severity: HIGH. Risk score: 83/100 (CRITICAL). Solar dropped 60% (+15 pts), battery at 38% (+18 pts), DO trend falling (+10 pts). Base floor for HIGH severity: 40 pts. Human approval MANDATORY."
            metric="Risk: 83/100 CRITICAL · Human Approval: REQUIRED" />
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-3">Risk Score Breakdown</div>
            <div className="space-y-2">
              {[
                { label: 'Base (HIGH severity event)', pts: 40, color: 'bg-rose-600' },
                { label: 'Solar drop ≥ 50%', pts: 15, color: 'bg-orange-500' },
                { label: 'Battery SOC < 40%', pts: 8, color: 'bg-purple-500' },
                { label: 'DO trend: falling', pts: 5, color: 'bg-blue-500' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="flex-1 text-[11px] text-slate-600">{r.label}</div>
                  <div className={`text-[11px] font-extrabold text-white px-2 py-0.5 rounded-full ${r.color} shrink-0`}>
                    +{r.pts}
                  </div>
                  <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full`} style={{ width: `${(r.pts / 40) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-extrabold text-rose-700">Total Risk Score</span>
                <span className="text-xl font-extrabold text-rose-700">68 / 100</span>
              </div>
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <div className="text-sm font-extrabold text-rose-800">Human Approval is Mandatory</div>
              <div className="text-xs text-rose-600">Risk score ≥ 40 triggers human-in-the-loop gate. No actions execute without operator sign-off.</div>
            </div>
          </div>
        </div>
      )
    },

    // ── STEP 7 ─────────────────────────────────────────────────────────────
    {
      id: 7, phase: 'Decision', icon: '🎯',
      title: 'Orchestrator Creates Plan',
      subtitle: 'AquaVolt synthesizes all 4 agents into a unified action plan',
      content: (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide mb-2">🟢 Keep Running — Critical Loads</div>
            <div className="space-y-1.5">
              {[
                { i: '🐟', l: 'Pond Aerators', d: 'VFD Soft-Start active — 6.4 kW managed', c: 'bg-emerald-100' },
                { i: '❄️', l: 'Cold Storage Refrigeration', d: 'Standard 4.0°C mode — product protected', c: 'bg-emerald-100' },
                { i: '💧', l: 'Water Circulation Pumps', d: '2.1 kW — essential pond circulation', c: 'bg-emerald-100' },
              ].map(r => (
                <div key={r.l} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${r.c}`}>
                  <span>{r.i}</span>
                  <div>
                    <div className="text-xs font-bold text-emerald-800">{r.l}</div>
                    <div className="text-[10px] text-emerald-600">{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide mb-2">🟠 Defer / Pause — Flexible Loads</div>
            <div className="space-y-1.5">
              {[
                { i: '🧊', l: 'Ice Production Plant', d: 'Paused 45 min — saves 3.0 kW', c: 'bg-amber-100' },
                { i: '🏭', l: 'Shrimp Processing Line', d: 'Paused — saves 4.0 kW', c: 'bg-amber-100' },
                { i: '💡', l: 'Non-essential Lighting', d: 'Reduced — saves 0.4 kW', c: 'bg-amber-100' },
              ].map(r => (
                <div key={r.l} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${r.c}`}>
                  <span>{r.i}</span>
                  <div>
                    <div className="text-xs font-bold text-amber-800">{r.l}</div>
                    <div className="text-[10px] text-amber-600">{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide mb-2">⚡ Energy Strategy</div>
            <div className="text-xs text-blue-800 space-y-1">
              <div>☀️ Use all available solar generation (4.1 kW)</div>
              <div>🔋 Battery discharge — above 20% reserve floor</div>
              <div>⚡ Grid: Standby backup available</div>
              <div>🌀 Aerator: Simulated VFD Soft-Start Sequence (120s ramp)</div>
            </div>
          </div>
        </div>
      )
    },

    // ── STEP 8 ─────────────────────────────────────────────────────────────
    {
      id: 8, phase: 'Decision', icon: '🛡️',
      title: 'Safety Engine Validates',
      subtitle: '9 deterministic safety policies checked — interventions applied',
      content: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-[#10233f] to-[#1a3560] rounded-xl p-4">
            <h3 className="text-sm font-extrabold text-white mb-3">9 Safety Policy Checks</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { p: 'P1 — Aeration (DO ≥ 3.5 mg/L)',         r: '✓ DO: 4.2 mg/L — PASS',          ok: true },
                { p: 'P2 — Cold Temp (≤ 5.0°C)',               r: '✓ Temp: 4.3°C — PASS',           ok: true },
                { p: 'P3 — Battery Floor (≥ 20%)',             r: '✓ SOC: 38% — PASS',              ok: true },
                { p: 'P4 — Inverter Limit (≤ 22 kW)',          r: '✓ Post-defer: 11.6 kW — PASS',   ok: true },
                { p: 'P5 — Soft-Start (inrush > 10 kW)',       r: '✓ VFD Ramp enforced — REPAIRED', ok: true },
                { p: 'P6 — Pre-Cool Boundaries (1–4.5°C)',     r: '✓ Verified — PASS',              ok: true },
                { p: 'P7 — High-Risk Action Approval',         r: '👤 Requires human sign-off',     ok: true },
                { p: 'P8 — Sensor Reliability',                r: '✓ All readings valid — PASS',    ok: true },
                { p: 'P9 — HIGH Severity Event',               r: '🔐 MANDATORY approval gate',     ok: true },
              ].map(check => (
                <div key={check.p} className={`flex items-start gap-2 text-[11px] rounded-lg px-2.5 py-2 ${check.ok ? 'bg-emerald-900/40 text-emerald-300' : 'bg-rose-900/40 text-rose-300'}`}>
                  <span className="shrink-0">{check.ok ? '✓' : '✗'}</span>
                  <div>
                    <div className="font-bold">{check.p}</div>
                    <div className="opacity-75 text-[10px]">{check.r}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-sm font-extrabold text-emerald-800">✓ Safety Engine: Plan Validated</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              All 9 policies checked. Aerator soft-start enforced (Policy 5). Human approval gate active (Policies 7 & 9).
              No unsafe actions allowed through.
            </p>
          </div>
        </div>
      )
    },

    // ── STEP 9 ─────────────────────────────────────────────────────────────
    {
      id: 9, phase: 'Decision', icon: '👤',
      title: 'Human Approval Required',
      subtitle: 'AquaVolt presents the full plan to the operator for review',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-[#10233f] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👤</span>
              <div>
                <h3 className="text-base font-extrabold text-white">Mandatory Operator Review</h3>
                <p className="text-xs text-blue-300 mt-0.5">HIGH severity event — approval required before any actions execute</p>
              </div>
              <span className="ml-auto text-[9px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2 py-1 rounded-full uppercase tracking-widest">
                Awaiting Approval
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-4 space-y-2 mb-4">
              <p className="text-xs text-slate-300 font-semibold">AquaVolt recommends:</p>
              <p className="text-sm text-white font-semibold leading-relaxed">
                Protect pond aeration & cold storage.
                Pause ice plant & processing for ~45 minutes.
                Use battery discharge above 20% floor.
                Apply VFD soft-start to aerator motors.
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">Risk: 83/100 CRITICAL</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-400/30 px-2 py-0.5 rounded-full font-bold">👤 Approval Required</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-600/90 rounded-xl py-3 text-center opacity-50 cursor-not-allowed">
                <div className="text-white font-extrabold text-sm">✓ Approve Plan</div>
                <div className="text-emerald-200 text-[10px]">(next step →)</div>
              </div>
              <div className="bg-amber-500/70 rounded-xl py-3 text-center opacity-30 cursor-not-allowed">
                <div className="text-white font-extrabold text-sm">✎ Modify Plan</div>
              </div>
              <div className="bg-rose-500/70 rounded-xl py-3 text-center opacity-30 cursor-not-allowed">
                <div className="text-white font-extrabold text-sm">✕ Reject Plan</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
            <span className="font-bold">Why does AquaVolt wait?</span> Because this is a high-severity energy event
            affecting life-critical shrimp aeration. The Safety Engine mandates operator confirmation before any
            simulated control commands are issued. This is by design — AquaVolt is an <em>orchestration assist</em>,
            not an autonomous controller.
          </div>
        </div>
      )
    },

    // ── STEP 10 ────────────────────────────────────────────────────────────
    {
      id: 10, phase: 'Decision', icon: '✅',
      title: 'Operator Approves Plan',
      subtitle: 'The plan is approved — AquaVolt proceeds to simulated execution',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-xl font-extrabold text-white mb-1">Plan Approved</h3>
            <p className="text-emerald-200 text-xs">14:32:05 — Demo Operator</p>
            <div className="mt-4 bg-emerald-600/50 rounded-xl px-4 py-3">
              <p className="text-emerald-100 text-sm font-semibold">
                "Simulated control commands dispatched to PoC Digital Control Layer."
              </p>
              <p className="text-emerald-300 text-[11px] mt-1">PoC Control Layer — no physical equipment controlled in this PoC.</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-3">Approval Record (Audit Trail)</div>
            <div className="space-y-1.5 text-xs">
              {[
                ['Decision', 'APPROVED'],
                ['Operator', 'Demo Operator'],
                ['Timestamp', '2026-10-02 14:32:05'],
                ['Event', 'SOLAR_DROP_60 — Solar generation dropped 60%'],
                ['Risk Score', '83/100 CRITICAL'],
                ['Policies Checked', '9/9 PASSED'],
                ['Action', 'Simulated commands dispatched to PoC Digital Control Layer'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-400 font-medium">{k}</span>
                  <span className="font-bold text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <span className="text-emerald-500 animate-pulse">●</span>
            <span className="text-xs font-semibold text-emerald-700">Proceeding to PoC Simulated Execution…</span>
            <PocBadge />
          </div>
        </div>
      )
    },

    // ── STEP 11 ────────────────────────────────────────────────────────────
    {
      id: 11, phase: 'Execution', icon: '🌀',
      title: '[SIM] Aerator Soft-Start Executes',
      subtitle: 'Simulated VFD frequency ramp — inrush surge suppressed in digital model',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <PocBadge />
            <span className="text-[10px] text-slate-500">No physical motors are controlled in this PoC</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🌀</span>
              <div>
                <h3 className="text-sm font-extrabold text-indigo-800">[SIM] VFD Soft-Start Sequence Active</h3>
                <p className="text-[10px] text-indigo-600">Simulated frequency ramp — 4 aerator motors</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Frequency Ramp: 0 → 50 Hz</span>
                  <span className="text-indigo-600">120 seconds</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>0 Hz (start)</span><span>25 Hz (now)</span><span>50 Hz (target)</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-100 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-rose-600 font-bold uppercase">DOL Inrush (prevented)</div>
                  <div className="text-2xl font-extrabold text-rose-800 line-through">18.5 kW</div>
                </div>
                <div className="bg-emerald-100 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-emerald-600 font-bold uppercase">VFD Clamped Peak</div>
                  <div className="text-2xl font-extrabold text-emerald-800">6.4 kW</div>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px] text-indigo-700">
                {[
                  '[14:32:06] Motor 1: Soft-start initiated (0 Hz)',
                  '[14:32:36] Motor 1: Ramp complete (50 Hz) · Motor 2: Initiated',
                  '[14:32:66] Motor 2: Ramp complete · Motor 3: Initiated',
                  '[14:32:96] Motor 3: Ramp complete · Motor 4: Initiated',
                  '[14:33:06] All 4 motors: Stable operation (50 Hz)',
                ].map((line, i) => (
                  <div key={i} className="font-mono bg-indigo-900/10 px-3 py-1.5 rounded-lg">{line}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-emerald-700">
              ✓ Inrush surge of 12.1 kW suppressed in simulated model. Inverter breaker protected. Motor wear modelled at −35%.
            </p>
          </div>
        </div>
      )
    },

    // ── STEP 12 ────────────────────────────────────────────────────────────
    {
      id: 12, phase: 'Execution', icon: '❄️',
      title: '[SIM] Thermal Strategy Executes',
      subtitle: 'Cold storage maintains safe temperature using thermal buffer',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <PocBadge />
            <span className="text-[10px] text-slate-500">No compressor relays are controlled in this PoC</span>
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">❄️</span>
              <div>
                <h3 className="text-sm font-extrabold text-cyan-800">[SIM] Cold Storage — Thermal Buffer Active</h3>
                <p className="text-[10px] text-cyan-600">Standard 4.0°C mode · Thermal buffer provides passive safety window</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-cyan-50 rounded-xl p-2">
                  <div className="text-lg font-extrabold text-cyan-800">{s.cold_temp}°C</div>
                  <div className="text-[10px] text-cyan-600">Current</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2">
                  <div className="text-lg font-extrabold text-emerald-800">4.0°C</div>
                  <div className="text-[10px] text-emerald-600">Target Mode</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-2">
                  <div className="text-lg font-extrabold text-blue-800">{s.thermal_buffer}h</div>
                  <div className="text-[10px] text-blue-600">Buffer Remaining</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Solar (4.1 kW) is below the 14 kW threshold needed for thermal pre-cooling.
                Cold room is holding at {s.cold_temp}°C with {s.thermal_buffer} hours of thermal buffer from the existing cold mass.
                Compressor cycles normally to maintain product safety.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <p className="text-[11px] font-bold text-emerald-700">
                  ✓ 2.8 tons of shrimp product protected · Cold chain continuity maintained
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
            <span className="font-bold">Note:</span> If solar were above 14 kW, AquaVolt would activate
            Simulated Thermal Pre-Cooling (1.5°C target) to store 6.8 kWh of free thermal energy.
            That feature is demonstrated in the Solar Normal scenario.
          </div>
        </div>
      )
    },

    // ── STEP 13 ────────────────────────────────────────────────────────────
    {
      id: 13, phase: 'Execution', icon: '🏭',
      title: '[SIM] Flexible Loads Deferred',
      subtitle: '7.0 kW of non-critical loads paused to protect battery reserve',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <PocBadge />
            <span className="text-[10px] text-slate-500">No contactors or relays are switched in this PoC</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '🧊', name: 'Ice Production Plant', before: '3.0 kW Active', after: 'PAUSED (45 min)', saving: '3.0 kW saved', color: 'border-amber-200 bg-amber-50' },
              { icon: '🏭', name: 'Shrimp Processing', before: '4.0 kW Active', after: 'PAUSED', saving: '4.0 kW saved', color: 'border-orange-200 bg-orange-50' },
              { icon: '💡', name: 'Aux Lighting', before: '0.8 kW Active', after: 'REDUCED 50%', saving: '0.4 kW saved', color: 'border-yellow-200 bg-yellow-50' },
            ].map(load => (
              <div key={load.name} className={`border rounded-xl p-3 ${load.color}`}>
                <div className="text-xl mb-1">{load.icon}</div>
                <div className="text-xs font-extrabold text-slate-800 mb-2">{load.name}</div>
                <div className="text-[10px] text-slate-500 line-through mb-1">{load.before}</div>
                <div className="text-[11px] font-bold text-amber-700 mb-2">→ {load.after}</div>
                <div className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 rounded-lg px-2 py-1 text-center">
                  ✓ {load.saving}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-3">Load Balance After Deferral</div>
            {[
              { label: 'Before (all loads)', value: 18.3, max: 22, color: 'bg-rose-400' },
              { label: 'After (flex loads deferred)', value: 11.3, max: 22, color: 'bg-emerald-500' },
              { label: 'Solar supply', value: 4.1, max: 22, color: 'bg-amber-400' },
            ].map(bar => (
              <div key={bar.label} className="mb-2">
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>{bar.label}</span><span className="font-bold">{bar.value} kW</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color} rounded-full transition-all duration-700`} style={{ width: `${(bar.value / bar.max) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700">
              ✓ 7.0 kW deferred · Battery reserve protected above 20% floor
            </div>
          </div>
        </div>
      )
    },

    // ── STEP 14 ────────────────────────────────────────────────────────────
    {
      id: 14, phase: 'Result', icon: '📈',
      title: 'Impact Metrics Calculated',
      subtitle: 'PoC-modelled estimates of energy, cost, and operational impact',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <PocBadge />
            <span className="text-[10px] text-slate-500">
              Estimated from load parameters, tariff ₹9.50/kWh, diesel 0.25 L/kWh
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResultCard icon="⚡" title="Energy Optimized" value="8.4 kWh" sub="Loads deferred across 45 min window" color="bg-amber-50 border-amber-200" />
            <ResultCard icon="₹" title="Cost Avoided" value="₹486" sub="At ₹9.50/kWh tariff" color="bg-green-50 border-green-200" />
            <ResultCard icon="🛢️" title="Diesel Avoided" value="2.1 L" sub="Equiv. backup generator fuel" color="bg-slate-50 border-slate-200" />
            <ResultCard icon="🌿" title="CO₂ Avoided" value="5.3 kg" sub="Equivalent avoided emissions" color="bg-emerald-50 border-emerald-200" />
            <ResultCard icon="🌀" title="Inrush Suppressed" value="12.1 kW" sub="VFD ramp vs DOL spike" color="bg-indigo-50 border-indigo-200" />
            <ResultCard icon="❄️" title="Product Protected" value="2.8 t" sub="Shrimp in cold storage" color="bg-cyan-50 border-cyan-200" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-3">WITHOUT vs WITH AquaVolt (PoC Comparison)</div>
            <div className="space-y-2 text-xs">
              {[
                ['Battery SOC', 'Drains to ~12% (below floor)', '✓ Protected at 26% (above 20% floor)'],
                ['Inverter Status', 'Potential trip from DOL inrush', '✓ VFD ramp — no trip risk'],
                ['Aeration', 'Risk of power cut to aerators', '✓ Locked as critical load'],
                ['Cold storage', 'Compressor may pause unsafely', '✓ Maintained within 2–5°C'],
                ['Operator load', 'Manual triage under pressure', '✓ AquaVolt handled priority routing'],
              ].map(([metric, without, withAV]) => (
                <div key={metric} className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100 last:border-0">
                  <span className="font-bold text-slate-600">{metric}</span>
                  <span className="text-rose-600">{without}</span>
                  <span className="text-emerald-700">{withAV}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },

    // ── STEP 15 ────────────────────────────────────────────────────────────
    {
      id: 15, phase: 'Result', icon: '📜',
      title: 'Audit Trail Recorded',
      subtitle: 'Complete event-to-outcome record logged for review',
      content: (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-extrabold text-white">📜 AquaVolt Audit Log Entry</span>
              <span className="text-[10px] text-slate-400 font-mono">2026-10-02 14:32:09</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'IoT Event', value: 'Solar generation dropped 60%', color: 'text-slate-800' },
                { label: 'Detected Risk', value: 'Risk Score 83/100 — CRITICAL · Mandatory approval required', color: 'text-rose-700' },
                { label: 'Agent Analysis', value: 'DO: 4.2 mg/L ↓ · Solar: 4.1 kW · Battery: 38% · Cold: 4.3°C ✓', color: 'text-slate-700' },
                { label: 'Recommended Action', value: 'Protect aeration (VFD soft-start) + cold storage; Defer ice plant & processing', color: 'text-slate-700' },
                { label: 'Safety Result', value: 'PASSED — 9/9 policies checked · Soft-start enforced · Approval gate active', color: 'text-emerald-700' },
                { label: 'Human Decision', value: 'APPROVED — Demo Operator · 14:32:05', color: 'text-emerald-700' },
                { label: 'Execution', value: '[PoC Simulated] Commands dispatched to PoC Digital Control Layer', color: 'text-blue-700' },
                { label: 'Impact', value: '8.4 kWh optimized · ₹79.80 cost avoided · 2.8 tons product protected', color: 'text-emerald-700' },
              ].map(row => (
                <div key={row.label} className="flex gap-3 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 font-medium w-36 shrink-0">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { time: '14:32:01', label: 'Event received', detail: 'Solar telemetry: 18.4→4.1 kW (−60%)', active: true },
              { time: '14:32:02', label: 'Agents analyzed', detail: 'Pond / Energy / Cold Chain / Risk — 4 specialists', active: true },
              { time: '14:32:03', label: 'Action plan generated', detail: 'Orchestrator synthesized unified strategy', active: true },
              { time: '14:32:04', label: 'Safety validation passed', detail: '9/9 policies verified · Soft-start enforced', active: true },
              { time: '14:32:05', label: 'Human approved', detail: 'Operator confirmed simulated command dispatch', active: true },
              { time: '14:32:06', label: '[SIM] Aerator Soft-Start', detail: 'VFD 0→50 Hz · 120s ramp · 6.4 kW clamped', active: true, poc: true },
              { time: '14:32:08', label: '[SIM] Thermal strategy applied', detail: 'Cold storage: 4.3°C → maintained standard mode', active: true, poc: true },
              { time: '14:32:09', label: '[SIM] Flexible loads deferred', detail: 'Ice plant + processing: −7.0 kW', active: true, poc: true },
            ].map(step => (
              <TimelineRow key={step.time} {...step} />
            ))}
          </div>
        </div>
      )
    },
  ];
}

// ─── Phase badge config ────────────────────────────────────────────────────────
const PHASE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Signal:    { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300' },
  Analysis:  { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300' },
  Decision:  { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300' },
  Execution: { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300' },
  Result:    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
};

// ─── Final result screen ───────────────────────────────────────────────────────
const FinalResultScreen: React.FC<{ onRestart: () => void; onClose: () => void }> = ({ onRestart, onClose }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center space-y-6">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
      <span className="text-4xl">⚡</span>
    </div>
    <div>
      <h2 className="text-3xl font-extrabold text-white mb-2">AquaVolt Result</h2>
      <p className="text-emerald-300 text-sm">SOLAR_DROP_60 · PS04 Flagship Scenario</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
      {[
        { icon: '✓', label: 'Critical operations protected', sub: 'Aeration + cold chain maintained' },
        { icon: '⚡', label: 'Energy optimized', sub: '8.4 kWh · ₹486 cost avoided' },
        { icon: '📉', label: 'Peak demand reduced', sub: '18.3 → 11.3 kW (−7.0 kW)' },
        { icon: '🔋', label: 'Battery reserve maintained', sub: 'Above 20% floor throughout' },
        { icon: '❄️', label: 'Cold-chain protected', sub: '2.8 tons shrimp · 4.3°C maintained' },
        { icon: '🌿', label: 'CO₂ avoided', sub: '5.3 kg · 2.1 L diesel equivalent' },
      ].map(item => (
        <div key={item.label} className="bg-emerald-800/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-400 font-extrabold">{item.icon}</span>
            <span className="text-xs font-extrabold text-white">{item.label}</span>
          </div>
          <p className="text-[11px] text-emerald-300">{item.sub}</p>
        </div>
      ))}
    </div>
    <div className="max-w-md">
      <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4">
        <p className="text-white font-extrabold text-base leading-relaxed">
          "Human-approved, safety-validated energy orchestration."
        </p>
        <p className="text-emerald-300 text-xs mt-2">
          AquaVolt · PS04 Hackathon PoC · Visakhapatnam Shrimp Hatchery
        </p>
      </div>
    </div>
    <div className="flex gap-3">
      <button
        onClick={onRestart}
        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition text-sm"
      >
        ↩ Restart Demo
      </button>
      <button
        onClick={onClose}
        className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition text-sm border border-white/20"
      >
        ✕ Exit Demo
      </button>
    </div>
  </div>
);

// ─── Main DemoMode component ───────────────────────────────────────────────────
export const DemoMode: React.FC<DemoModeProps> = ({ onClose }) => {
  const steps = buildSteps();
  const TOTAL = steps.length;

  const [current, setCurrent] = useState(0); // 0 = intro, 1-15 = steps, 16 = result
  const [showResult, setShowResult] = useState(false);

  const step = current >= 1 && current <= TOTAL ? steps[current - 1] : null;
  const progress = current === 0 ? 0 : Math.round((current / TOTAL) * 100);
  const phaseCfg = step ? (PHASE_CONFIG[step.phase] ?? PHASE_CONFIG.Signal) : PHASE_CONFIG.Signal;

  const goNext = useCallback(() => {
    if (current < TOTAL) setCurrent(c => c + 1);
    else setShowResult(true);
  }, [current, TOTAL]);

  const goBack = useCallback(() => {
    if (showResult) { setShowResult(false); return; }
    if (current > 0) setCurrent(c => c - 1);
  }, [current, showResult]);

  const goSkip = () => { setShowResult(true); };
  const restart = () => { setCurrent(0); setShowResult(false); };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goBack, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col w-full h-full bg-[#0c1a2e] overflow-hidden">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="bg-[#10233f] border-b border-white/10 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff8b32] to-[#1d8bd5] flex items-center justify-center font-bold text-white">⚡</div>
            <div>
              <span className="text-sm font-extrabold text-white">AquaVolt</span>
              <span className="ml-2 text-[10px] font-extrabold bg-[#ff7a21] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Judge Demo Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:block">
              Use ← → arrow keys or buttons below
            </span>
            <PocBadge />
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
              title="Exit Demo (Esc)"
            >✕</button>
          </div>
        </div>

        {/* ── Progress bar ────────────────────────────────────────────────── */}
        {!showResult && (
          <div className="h-1 bg-white/10 shrink-0">
            <div
              className="h-full bg-gradient-to-r from-[#ff7a21] to-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* RESULT SCREEN */}
          {showResult && (
            <FinalResultScreen onRestart={restart} onClose={onClose} />
          )}

          {/* INTRO SCREEN */}
          {!showResult && current === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 px-8 py-10 text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff8b32] to-[#1d8bd5] flex items-center justify-center shadow-2xl shadow-blue-900/50">
                <span className="text-5xl">⚡</span>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white mb-2">AquaVolt</h1>
                <p className="text-blue-300 text-sm mb-1">Smart Energy Orchestration · PS04 Hackathon</p>
                <p className="text-slate-400 text-xs">Shrimp Hatchery · Thermal Pre-Cooling · Aerator Soft-Start Rig</p>
              </div>
              <div className="max-w-lg bg-white/5 border border-white/10 rounded-2xl p-5">
                <h2 className="text-white font-extrabold text-lg mb-2">
                  ☀️ Flagship Scenario: Solar Generation Drops 60%
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  This 15-step demo walks through AquaVolt's complete response — from IoT signal to
                  human approval to simulated execution and impact measurement.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-center">
                  {[
                    ['📡 2 steps', 'Signal'],
                    ['🔬 4 steps', 'Analysis'],
                    ['🎯 3 steps', 'Decision'],
                    ['⚙️ 3 steps', 'Execution'],
                    ['📊 2 steps', 'Result'],
                    ['⏱ ~3 min', 'Duration'],
                  ].map(([v, l]) => (
                    <div key={l} className="bg-white/10 rounded-lg py-2 px-1">
                      <div className="text-white font-bold">{v}</div>
                      <div className="text-slate-400">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={goNext}
                className="px-10 py-4 bg-gradient-to-r from-[#ff7a21] to-[#ff9a50] hover:from-[#ff6a10] hover:to-[#ff8840] text-white font-extrabold text-lg rounded-2xl transition shadow-lg shadow-orange-900/40"
              >
                ▶ Start Demo
              </button>
              <p className="text-slate-500 text-[11px]">Press Enter or → to advance · ← to go back · Esc to exit</p>
            </div>
          )}

          {/* STEP SCREEN */}
          {!showResult && step && (
            <div className="flex flex-1 overflow-hidden flex-col">
              {/* Step header */}
              <div className="px-6 pt-5 pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-widest ${phaseCfg.bg} ${phaseCfg.text} ${phaseCfg.border}`}>
                        {step.phase}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Step {step.id} of {TOTAL}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white leading-tight">{step.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{step.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Step content (scrollable) */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {step.content}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom navigation bar ────────────────────────────────────────── */}
        {!showResult && (
          <div className="bg-[#10233f] border-t border-white/10 px-5 py-3 flex items-center justify-between gap-3 shrink-0">
            {/* Left: step dots */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
              {steps.map((s, i) => {
                const stepNum = i + 1;
                const isCurrent = stepNum === current;
                const isDone = stepNum < current;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrent(stepNum)}
                    title={`Step ${stepNum}: ${s.title}`}
                    className={`shrink-0 rounded-full transition-all ${
                      isCurrent ? 'w-4 h-4 bg-[#ff7a21]' :
                      isDone    ? 'w-2 h-2 bg-emerald-500' :
                                  'w-2 h-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                );
              })}
            </div>

            {/* Center: step label on mobile */}
            <div className="sm:hidden text-[11px] text-slate-400 flex-1 text-center">
              {current === 0 ? 'Intro' : current <= TOTAL ? `${current} / ${TOTAL}` : 'Complete'}
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
              <button
                onClick={restart}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
                title="Restart Demo"
              >
                ↩ Restart
              </button>
              <button
                onClick={goBack}
                disabled={current === 0}
                className="px-4 py-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition"
              >
                ← Back
              </button>
              <button
                onClick={goSkip}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
              >
                Skip to end ⏭
              </button>
              <button
                onClick={goNext}
                className="px-6 py-2 text-sm font-extrabold text-white bg-gradient-to-r from-[#ff7a21] to-[#ff9a50] hover:from-[#ff6a10] hover:to-[#ff8840] rounded-xl transition shadow-md"
              >
                {current === 0 ? '▶ Start' : current >= TOTAL ? 'See Results →' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
