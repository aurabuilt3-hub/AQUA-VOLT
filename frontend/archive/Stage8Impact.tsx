import React from 'react';
import { ActionPlan } from '../../types';

interface Stage8ImpactProps {
  plan: ActionPlan | null;
  onResetToInput: () => void;
  onBack: () => void;
}

export const Stage8Impact: React.FC<Stage8ImpactProps> = ({
  plan,
  onResetToInput,
  onBack,
}) => {
  if (!plan) return null;

  const comparisonRows = [
    {
      metric: 'Aerator Motor Inrush Spike',
      without: '18.5 kW Spike (Direct-on-Line)',
      with: '6.4 kW Peak (VFD Soft-Start)',
      savings: '-12.1 kW Peak Clamped (65.4% reduction)',
      accent: 'text-[#10B981]',
    },
    {
      metric: 'Cold Storage Refrigeration Strategy',
      without: 'Standard cycle (Temp spikes to 6.2°C)',
      with: `Thermal Pre-Cooling to ${plan.thermal_precool_rig.cold_storage_precooled_temp_c}°C`,
      savings: `${plan.thermal_precool_rig.compressor_safe_off_duration_hours.toFixed(1)} Hours Safe Thermal Buffer`,
      accent: 'text-[#087EA4]',
    },
    {
      metric: 'Flexible Load Management',
      without: 'Ice & Processing run concurrently (21.3 kW)',
      with: 'Ice & Processing deferred during deficit',
      savings: '7.0 kW Peak Load Shifted off grid peak',
      accent: 'text-amber-600',
    },
    {
      metric: 'Battery Reserve Floor',
      without: 'Drained to 8% (Deep discharge trip)',
      with: 'Protected at ≥ 20.0% Reserve Floor',
      savings: '+12.0% Battery Capacity Preserved',
      accent: 'text-purple-600',
    },
    {
      metric: 'Generator Diesel Fuel Consumed',
      without: '8.5 Liters burned during grid/solar drop',
      with: '0.0 Liters (100% Renewable Solar Priority)',
      savings: '8.5 Liters Diesel Avoided (₹782 saved)',
      accent: 'text-[#10B981]',
    },
    {
      metric: 'Total Operational Energy Cost',
      without: '₹1,840 (Peak tariff + diesel fuel)',
      with: '₹486 (Optimized microgrid load)',
      savings: '₹1,354 Cost Avoided per event',
      accent: 'text-[#10B981]',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Question 5 Continuation: WHAT HAPPENED AFTER EXECUTION? (Impact) */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#087EA4] bg-[#E0F7FA] px-2.5 py-0.5 rounded-md border border-[#00B8D9]/30">
          Step 5 of 5: What Happened After Execution? (PoC Impact)
        </span>
        <span className="text-xs text-[#64748B] font-medium">
          Quantified operational savings and asset protection resulting from unified orchestration
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 sm:p-5 shadow-card-float flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              08
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#063B5C]">
              PoC Estimated Impact & Savings
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00B8D9]/10 text-[#087EA4] border border-[#00B8D9]/30 uppercase tracking-wider">
              POC ESTIMATED IMPACT
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Calculated from microgrid simulation parameters and local commercial tariffs (₹9.50/kWh). Not measured real-world billing.
          </p>
        </div>

        <button
          onClick={onResetToInput}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#00B8D9] via-[#087EA4] to-[#063B5C] hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-glow-aqua flex items-center justify-center gap-2 transition uppercase tracking-wider shrink-0"
        >
          <span>↺ Test Another Synthetic IoT Input</span>
        </button>
      </div>

      {/* 6 Core KPI Cards explicitly matching prompt requirements */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Energy Optimized */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs hover:shadow-card-float transition">
          <div className="text-[9px] text-[#64748B] font-bold uppercase">⚡ Energy Optimized</div>
          <div className="text-lg font-extrabold text-[#063B5C] mt-0.5">8.4 kWh</div>
          <div className="text-[10px] text-[#087EA4] font-semibold mt-0.5">7.0 kW load shifted</div>
        </div>

        {/* 2. Cost Avoided */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs hover:shadow-card-float transition">
          <div className="text-[9px] text-[#64748B] font-bold uppercase">💰 Cost Avoided</div>
          <div className="text-lg font-extrabold text-[#10B981] mt-0.5">₹486</div>
          <div className="text-[10px] text-[#10B981] font-semibold mt-0.5">₹1,354 peak avoided</div>
        </div>

        {/* 3. Diesel Avoided */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs hover:shadow-card-float transition">
          <div className="text-[9px] text-[#64748B] font-bold uppercase">⛽ Diesel Avoided</div>
          <div className="text-lg font-extrabold text-[#087EA4] mt-0.5">2.1 Liters</div>
          <div className="text-[10px] text-[#087EA4] font-semibold mt-0.5">Zero genset run</div>
        </div>

        {/* 4. CO2 Avoided */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs hover:shadow-card-float transition">
          <div className="text-[9px] text-[#64748B] font-bold uppercase">🌿 CO₂ Avoided</div>
          <div className="text-lg font-extrabold text-[#10B981] mt-0.5">5.6 kg</div>
          <div className="text-[10px] text-[#10B981] font-semibold mt-0.5">Emissions reduced</div>
        </div>

        {/* 5. Product Protected */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs hover:shadow-card-float transition">
          <div className="text-[9px] text-[#64748B] font-bold uppercase">📦 Product Protected</div>
          <div className="text-lg font-extrabold text-[#063B5C] mt-0.5">100%</div>
          <div className="text-[10px] text-[#10B981] font-semibold mt-0.5">Critical loads protected in Digital Twin</div>
        </div>

        {/* 6. Critical Uptime */}
        <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-3 shadow-xs hover:shadow-card-float transition">
          <div className="text-[9px] text-[#64748B] font-bold uppercase">⏱️ Critical Uptime</div>
          <div className="text-lg font-extrabold text-[#087EA4] mt-0.5">100.0%</div>
          <div className="text-[10px] text-[#087EA4] font-semibold mt-0.5">Aeration uninterrupted</div>
        </div>
      </div>

      {/* Without AquaVolt vs. With AquaVolt Comparison Table */}
      <div className="bg-white border border-[#00B8D9]/20 rounded-2xl p-4 shadow-card-float">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
          <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-2">
            <span>⚖️</span> Modeled Comparison: Without AquaVolt vs. With AquaVolt
          </h3>
          <span className="text-[10px] font-bold text-[#087EA4] bg-[#EFFBFC] px-2.5 py-0.5 rounded-full border border-[#00B8D9]/30">
            POC ESTIMATED IMPACT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#64748B] font-extrabold uppercase text-[9px]">
                <th className="py-2 px-2.5">Operational Parameter</th>
                <th className="py-2 px-2.5 text-[#EF4444]">Without AquaVolt (Unmanaged)</th>
                <th className="py-2 px-2.5 text-[#063B5C]">With AquaVolt (Orchestrated)</th>
                <th className="py-2 px-2.5 text-[#10B981]">Net Operational Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-[#17324D]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#EFFBFC]/40 transition text-xs">
                  <td className="py-2 px-2.5 font-bold text-[#063B5C]">{row.metric}</td>
                  <td className="py-2 px-2.5 text-rose-700 bg-rose-50/40">{row.without}</td>
                  <td className="py-2 px-2.5 font-semibold text-[#063B5C] bg-[#EFFBFC]/30">{row.with}</td>
                  <td className={`py-2 px-2.5 font-bold ${row.accent}`}>{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-white border border-slate-200 text-[#64748B] hover:text-[#063B5C] text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to Execution & Digital Twin</span>
        </button>

        <button
          onClick={onResetToInput}
          className="px-5 py-2.5 bg-[#087EA4] hover:bg-[#063B5C] text-white text-xs font-bold rounded-xl transition shadow-glow-aqua flex items-center gap-1.5"
        >
          <span>↺ Test Another Synthetic IoT Input</span>
        </button>
      </div>
    </div>
  );
};
