import React, { useEffect, useState } from 'react';
import { checkBackendHealth, fetchAIHealth } from '../services/api';
import { AIHealthStatus } from '../types';
import { MainNavDestination } from './Sidebar';

interface HeaderProps {
  activeView: MainNavDestination;
  onNavigate: (view: MainNavDestination) => void;
  onOpenCopilot: () => void;
  onOpenAuditLog: () => void;
  onToggleMobileMenu?: () => void;
}

const VIEW_TITLES: Record<MainNavDestination, { title: string; subtitle: string }> = {
  facility: {
    title: 'Facility Operations',
    subtitle: 'Visakhapatnam Unit #1 · Scenario Telemetry & Load Balancing (Simulated Digital Twin)',
  },
  agents: {
    title: 'Agent Operations',
    subtitle: 'Transparent 10-Step Multi-Agent Execution Pipeline Trace',
  },
  governance: {
    title: 'Governance & Approvals',
    subtitle: 'Deterministic Safety Evaluation & Operator Review Thresholds',
  },
  twin: {
    title: 'Digital Twin Model',
    subtitle: 'PS04 Microgrid Energy Flow & Equipment Simulation',
  },
  audit: {
    title: 'Governance Audit Trail',
    subtitle: 'Governance Audit Trail · Session Verification & Impact Evidence',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onOpenCopilot,
  onOpenAuditLog,
  onToggleMobileMenu,
}) => {
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [aiHealth, setAiHealth] = useState<AIHealthStatus | null>(null);

  // Poll backend health & AI health honestly
  useEffect(() => {
    let isMounted = true;
    const check = () => {
      checkBackendHealth()
        .then((res) => {
          if (isMounted) setBackendConnected(res !== null && res.status === 'ok');
        })
        .catch(() => {
          if (isMounted) setBackendConnected(false);
        });

      fetchAIHealth()
        .then((res) => {
          if (isMounted) setAiHealth(res);
        })
        .catch(() => {
          if (isMounted) setAiHealth(null);
        });
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const currentMeta = VIEW_TITLES[activeView] || VIEW_TITLES.facility;

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-white via-white to-[#F0FBF9] border border-sky-100 rounded-2xl px-4 py-3 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
      {/* Wide aquaculture/shrimp-pond illustration on the right side with a pale aqua gradient fading toward the left */}
      <div className="absolute inset-y-0 right-0 w-1/2 sm:w-4/5 md:w-2/3 lg:w-3/5 pointer-events-none overflow-hidden flex items-center justify-end opacity-85">
        <img
          src="/aquaculture_header_pond.svg"
          alt="Aquaculture Shrimp Pond Backdrop"
          className="h-full w-full object-cover object-right select-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/clean_landscape.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
      </div>

      {/* Title & Dynamic Breadcrumb */}
      <div className="relative z-10 flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            aria-label="Toggle Navigation Menu"
          >
            ☰
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              <span className="text-teal-700 font-extrabold">{currentMeta.title}</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
              Facility: <strong className="text-teal-700 font-bold">Visakhapatnam Unit #1</strong>
            </span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hidden md:inline">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Digital Twin Model: <strong className="text-slate-700 font-semibold">Simulated Sync (50.0 Hz)</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {currentMeta.subtitle}
          </div>
        </div>
      </div>

      {/* Right Utility & Service Status Actions */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
        {/* Backend Connection Health Badge (Honest status derived from /api/health) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            backendConnected === true
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : backendConnected === false
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
          title={
            backendConnected === true
              ? 'FastAPI Intelligence Layer connected and responding'
              : backendConnected === false
              ? 'FastAPI Intelligence Layer unreachable'
              : 'Checking connectivity...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendConnected === true
                ? 'bg-emerald-500 animate-pulse'
                : backendConnected === false
                ? 'bg-rose-500'
                : 'bg-slate-400'
            }`}
          />
          <span className="text-[11px]">
            {backendConnected === true
              ? 'Backend Connected'
              : backendConnected === false
              ? 'Backend Offline'
              : 'Checking Backend'}
          </span>
        </div>

        {/* AI Gateway / Gemini Availability Badge (Distinguishes Backend Connected from Gemini Available) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            aiHealth?.ai_configured
              ? 'bg-teal-50 text-teal-800 border-teal-200'
              : 'bg-sky-50/70 text-sky-800 border-sky-200'
          }`}
          title={
            aiHealth?.ai_configured
              ? 'Gemini 2.5 Flash active in AI Gateway'
              : 'AI Gateway in Safe Deterministic Fallback mode (GEMINI_API_KEY not configured)'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              aiHealth?.ai_configured ? 'bg-teal-500' : 'bg-sky-500'
            }`}
          />
          <span className="text-[11px]">
            {aiHealth?.ai_configured
              ? 'Gemini Available'
              : 'AI: Deterministic Fallback'}
          </span>
        </div>

        {/* Action: Quick Copilot Trigger */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition shadow-2xs"
          title="Open AquaVolt Contextual Copilot"
        >
          <span>💬</span>
          <span>Copilot</span>
        </button>

        {/* Action: Quick Audit Trail Trigger */}
        <button
          type="button"
          onClick={() => onNavigate('audit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs border ${
            activeView === 'audit'
              ? 'bg-teal-50 text-teal-800 border-teal-300'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
          title="Inspect Immutable Governance Audit Trail"
        >
          <span>📜</span>
          <span>Audit Trail</span>
        </button>
      </div>
    </header>
  );
};
