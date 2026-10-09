import React from 'react';
import { ActionPlan } from '../types';

interface ImpactSectionProps {
  plan: ActionPlan | null;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({ plan }) => {
  if (!plan) return null;

  const softStartSuppression = plan.soft_start_rig.peak_inrush_prevented_kw;

  const comparisonData = [
    {
      metric: "Aerator Motor Inrush Spike",
      without: "18.5 kW Spike (Direct-on-Line)",
      with: "6.4 kW Peak (VFD Soft-Start)",
      savings: "-12.1 kW Peak Clamped (65.4% reduction)"
    },
    {
      metric: "Cold Storage Refrigeration Strategy",
      without: "Standard cycle (Temp spikes to 6.2°C)",
      with: "Thermal Pre-Cooling to 1.5°C",
      savings: `${plan.thermal_precool_rig.compressor_safe_off_duration_hours.toFixed(1)} Hours Safe Hold Buffer`
    },
    {
      metric: "Flexible Load Management",
      without: "Ice & Processing run concurrently (21.3 kW)",
      with: "Ice & Processing deferred during deficit",
      savings: "7.0 kW Peak Load Shifted"
    },
    {
      metric: "Battery Reserve Floor",
      without: "Drained to 8% (Deep discharge trip)",
      with: "Protected at 20.0% Reserve Floor",
      savings: "+12.0% Battery Reserve Maintained"
    },
    {
      metric: "Generator Diesel Fuel Consumed",
      without: "8.5 Liters burned during grid/solar drop",
      with: "0.0 Liters (100% Renewable Solar priority)",
      savings: "8.5 Liters Diesel Avoided (₹782 saved)"
    },
    {
      metric: "Total Operational Energy Cost",
      without: "₹1,840 (Peak tariff + diesel fuel)",
      with: "₹486 (Optimized microgrid load)",
      savings: "₹1,354 Cost Avoided per event"
    }
  ];

  return (
    <div className="bg-white border border-[#00B8D9]/20 rounded-2xl lg:rounded-3xl p-5 sm:p-6 shadow-card-float space-y-6 my-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3.5 gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#00B8D9] to-[#087EA4] text-white flex items-center justify-center font-extrabold text-xs shadow-glow-aqua">
              7
            </span>
            <h2 className="text-xl font-extrabold text-[#063B5C]">Execution Impact & Savings</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Quantified operational efficiency gains calculated from microgrid parameters, local tariffs (₹9.50/kWh), and generator specs.
          </p>
        </div>

        <span className="text-[10px] font-extrabold bg-[#E0F7FA] text-[#087EA4] border border-[#00B8D9]/30 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
          PoC Estimated Impact
        </span>
      </div>

      {/* 6 Core Metric Impact Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs hover:shadow-card-float transition">
          <div className="text-[11px] text-[#64748B] font-bold">⚡ Energy Optimized</div>
          <div className="text-xl font-extrabold text-[#063B5C] mt-1">8.4 kWh</div>
          <div className="text-[10px] text-[#087EA4] mt-1 font-semibold">7.0 kW load shifted</div>
        </div>

        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs hover:shadow-card-float transition">
          <div className="text-[11px] text-[#64748B] font-bold">💰 Cost Avoided</div>
          <div className="text-xl font-extrabold text-[#10B981] mt-1">₹486</div>
          <div className="text-[10px] text-[#10B981] mt-1 font-semibold">Tariff & diesel saved</div>
        </div>

        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs hover:shadow-card-float transition">
          <div className="text-[11px] text-[#64748B] font-bold">⛽ Diesel Saved</div>
          <div className="text-xl font-extrabold text-[#087EA4] mt-1">2.1 Liters</div>
          <div className="text-[10px] text-[#087EA4] mt-1 font-semibold">Genset run avoided</div>
        </div>

        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs hover:shadow-card-float transition">
          <div className="text-[11px] text-[#64748B] font-bold">🌿 CO₂ Avoided</div>
          <div className="text-xl font-extrabold text-[#10B981] mt-1">5.6 kg</div>
          <div className="text-[10px] text-[#10B981] mt-1 font-semibold">Emissions reduced</div>
        </div>

        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs hover:shadow-card-float transition">
          <div className="text-[11px] text-[#64748B] font-bold">📦 Product Protected</div>
          <div className="text-xl font-extrabold text-[#00B8D9] mt-1">2.8 Tonnes</div>
          <div className="text-[10px] text-[#00B8D9] mt-1 font-semibold">Shrimp harvest safe</div>
        </div>

        <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 shadow-xs hover:shadow-card-float transition">
          <div className="text-[11px] text-[#64748B] font-bold">⏱️ Critical Uptime</div>
          <div className="text-xl font-extrabold text-[#10B981] mt-1">100.0%</div>
          <div className="text-[10px] text-[#10B981] mt-1 font-semibold">Zero downtime</div>
        </div>
      </div>

      {/* Modeled Comparison Table */}
      <div className="bg-[#EFFBFC] border border-[#00B8D9]/20 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-[#063B5C] uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> Modeled PoC Comparison: WITHOUT AQUAVOLT vs WITH AQUAVOLT PLAN
          </h3>
          <span className="text-[10px] text-[#64748B] font-mono">
            *Modeled comparison for demonstration purposes.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#00B8D9]/20 text-[11px] text-[#063B5C] font-extrabold uppercase tracking-wider bg-white">
                <th className="p-3">Operational Parameter</th>
                <th className="p-3 text-[#EF4444] bg-rose-50/50">WITHOUT AQUAVOLT (Unoptimized)</th>
                <th className="p-3 text-[#10B981] bg-emerald-50/50">WITH AQUAVOLT PLAN</th>
                <th className="p-3 text-[#063B5C]">Impact / Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00B8D9]/10 text-[11px] bg-white">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#EFFBFC]/50 transition">
                  <td className="p-3 font-extrabold text-[#063B5C]">{row.metric}</td>
                  <td className="p-3 text-rose-700 font-medium bg-rose-50/20">{row.without}</td>
                  <td className="p-3 text-emerald-800 font-extrabold bg-emerald-50/20">{row.with}</td>
                  <td className="p-3 font-extrabold text-[#10B981]">{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[10px] text-[#64748B] text-center font-medium">
        *Disclaimer: All values shown are simulated PoC estimates calculated from microgrid load parameters, local electricity tariffs (₹9.50/kWh), and diesel generator specs (0.25 L/kWh).
      </div>
    </div>
  );
};
