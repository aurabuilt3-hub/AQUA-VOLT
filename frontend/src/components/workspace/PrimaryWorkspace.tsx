import React, { useState, useEffect } from 'react';
import {
  UnifiedAnalysisResponse,
  ApprovalRequest,
  ExecutionResult,
  AuditLogEntry,
  AIHealthStatus
} from '../../types';
import {
  analyzeOperationalInput,
  postApproval,
  fetchDigitalTwinState,
  fetchAuditLogs,
  checkBackendHealth,
  fetchAIHealth
} from '../../services/api';
import { SafetyMatrixModal } from './SafetyMatrixModal';
import { PS04DigitalTwinModal } from './PS04DigitalTwinModal';

export interface ScenarioConfig {
  id: string;
  name: string;
  icon: string;
  category: string;
  summary: string;
  text: string;
  bannerTitle: string;
  description: string;
  telemetrySummary: string;
  illustration: string;
  illustrationAlt: string;
  baselineTelemetry: {
    doValue: string;
    pondTemp: string;
    solarGen: string;
    batterySoc: string;
    coldRoomTemp: string;
    facilityLoadKw: string;
  };
}

export const SCENARIO_CONFIGS: ScenarioConfig[] = [
  {
    id: "SOLAR_DROP_60",
    name: "Solar Drop + Falling Pond Oxygen",
    icon: "☀️",
    category: "Microgrid Transition",
    summary: "PV 4.1 kW (-60%) · BESS 38% · DO 4.2 mg/L falling · 18.3 kW Load",
    text: "Solar generation dropped 60%. Battery SOC is 38%. Pond DO is 4.2 mg/L and falling. Cold room is 4.3°C. Facility load is 18.3 kW. Grid is available.",
    bannerTitle: "Solar generation has dropped",
    description: "Solar generation reduced by 60% due to sudden cloud cover. Battery SOC is 38% and pond DO is falling. AquaVolt can assess microgrid allocation and protect critical aeration.",
    telemetrySummary: "Solar: 4.1 kW (-60%) · BESS: 38% · DO: 4.2 mg/L · Cold Room: 4.3°C · Load: 18.3 kW",
    illustration: "/solar_pond_art.png",
    illustrationAlt: "Solar generation drop scenario illustration",
    baselineTelemetry: {
      doValue: "4.2 mg/L",
      pondTemp: "28.1 °C",
      solarGen: "4.1 kW",
      batterySoc: "38%",
      coldRoomTemp: "4.3 °C",
      facilityLoadKw: "18.3"
    }
  },
  {
    id: "GRID_FAILURE",
    name: "Grid Outage + Battery Stress",
    icon: "⚡",
    category: "Island Transition",
    summary: "Grid 0V offline · PV 9.2 kW · BESS 62% · Microgrid Islanding",
    text: "Main electrical grid power lost. Solar generation is 9.2 kW. Battery SOC is 62%. Pond DO is 4.4 mg/L. Cold room is 4.2°C. Total load is 14.2 kW. Microgrid switching to island mode.",
    bannerTitle: "Grid power is unavailable",
    description: "Main electrical grid power lost. Microgrid switching to solar + battery island mode to preserve 12.0 kW critical life-support aeration on solar and battery storage.",
    telemetrySummary: "Grid: 0.0 kW (Offline) · Solar: 9.2 kW · BESS: 62% · Cold Room: 4.2°C · Load: 14.2 kW",
    illustration: "/clean_solar.png",
    illustrationAlt: "Grid power outage scenario illustration",
    baselineTelemetry: {
      doValue: "4.4 mg/L",
      pondTemp: "28.0 °C",
      solarGen: "9.2 kW",
      batterySoc: "62%",
      coldRoomTemp: "4.2 °C",
      facilityLoadKw: "14.2"
    }
  },
  {
    id: "POND_DO_FALLING",
    name: "Critical Pond Oxygen + Aerator Start",
    icon: "🦐",
    category: "Life-Safety Defense",
    summary: "DO 2.9 mg/L (Critical) · 2 of 6 aerators on · 18.5 kW potential surge",
    text: "Dissolved oxygen in Pond #2 dropped to critical 2.9 mg/L and falling rapidly. 2 of 6 aerators running. Emergency aerator start requires VFD soft-start surge clamping. Solar is 12.2 kW. Battery is 52%.",
    bannerTitle: "Critical pond oxygen detected",
    description: "Dissolved oxygen in pond has fallen to critical 2.9 mg/L and rapidly declining. Immediate aeration boost required to avoid biological biomass mortality.",
    telemetrySummary: "DO: 2.9 mg/L (Critical) · Water Temp: 29.4°C · Aerators: 2 of 6 On · PV: 12.2 kW",
    illustration: "/shrimp_splash.png",
    illustrationAlt: "Critical pond oxygen scenario illustration",
    baselineTelemetry: {
      doValue: "2.9 mg/L",
      pondTemp: "29.4 °C",
      solarGen: "12.2 kW",
      batterySoc: "52%",
      coldRoomTemp: "4.1 °C",
      facilityLoadKw: "15.5"
    }
  },
  {
    id: "SOLAR_NORMAL",
    name: "Solar Surplus + Thermal Pre-Cooling",
    icon: "❄️",
    category: "Thermal Storage Buffer",
    summary: "PV 18.4 kW peak · BESS 72% · Cold Room 4.1°C · Pre-Cool Window",
    text: "Optimal midday solar output at 18.4 kW with 7.2 kW generation surplus. Battery SOC is 72%. Pond DO is 5.4 mg/L. Cold room is 4.1°C. Grid available. Ideal window to engage Thermal Pre-Cooling down to 1.5°C.",
    bannerTitle: "Solar surplus available",
    description: "Optimal midday solar output at 18.4 kW with 7.2 kW generation surplus. Battery SOC is 72%. Ideal window to engage Thermal Pre-Cooling down to 1.5°C.",
    telemetrySummary: "Solar Surplus: +7.2 kW · PV: 18.4 kW · BESS: 72% · Cold Room: 4.1°C · Pre-Cool Active",
    illustration: "/solar_pond.png",
    illustrationAlt: "Solar surplus scenario illustration",
    baselineTelemetry: {
      doValue: "5.4 mg/L",
      pondTemp: "28.1 °C",
      solarGen: "18.4 kW",
      batterySoc: "72%",
      coldRoomTemp: "4.1 °C",
      facilityLoadKw: "11.2"
    }
  },
  {
    id: "NORMAL_OPERATION",
    name: "Normal Hatchery Operation",
    icon: "🌿",
    category: "Nominal Baseline",
    summary: "PV 18.4 kW nominal · BESS 80% · DO 5.4 mg/L · Grid online · Auto-Safe",
    text: "Solar generation normal at 18.4 kW. Battery SOC is 80%. Pond DO is 5.4 mg/L and rising. Cold room is 4.0°C. Total load is 11.2 kW. Grid is online.",
    bannerTitle: "Hatchery operating normally",
    description: "Nominal midday telemetry across all ponds and microgrid subsystems. Dissolved oxygen is 5.4 mg/L and stable. Life-critical systems operating within target envelopes.",
    telemetrySummary: "Nominal · PV: 18.4 kW · BESS: 80% · DO: 5.4 mg/L · Cold Room: 4.0°C · Grid: Online",
    illustration: "/clean_landscape.png",
    illustrationAlt: "Normal hatchery operation scenario illustration",
    baselineTelemetry: {
      doValue: "5.4 mg/L",
      pondTemp: "27.9 °C",
      solarGen: "18.4 kW",
      batterySoc: "80%",
      coldRoomTemp: "4.0 °C",
      facilityLoadKw: "11.2"
    }
  }
];

// Alias for backwards compatibility
export const TEMPLATE_INPUTS = SCENARIO_CONFIGS;

interface PrimaryWorkspaceProps {
  selectedScenarioId?: string;
  onNavigate?: (view: any) => void;
  onOpenCopilot?: () => void;
  onToggleMobileMenu?: () => void;
  analysis?: UnifiedAnalysisResponse | null;
  setAnalysis?: (res: UnifiedAnalysisResponse | null) => void;
  analysisLoading?: boolean;
  decisionState?: 'pending' | 'approved' | 'modified' | 'rejected';
  setDecisionState?: (state: 'pending' | 'approved' | 'modified' | 'rejected') => void;
  executionResult?: ExecutionResult | null;
  setExecutionResult?: (res: ExecutionResult | null) => void;
  submittingAction?: boolean;
  feedbackMsg?: string | null;
  setFeedbackMsg?: (msg: string | null) => void;
  isModifyMode?: boolean;
  setIsModifyMode?: (val: boolean) => void;
  overrideIcePlant?: boolean;
  setOverrideIcePlant?: (val: boolean) => void;
  overrideProcessing?: boolean;
  setOverrideProcessing?: (val: boolean) => void;
  onRunAnalysis?: (text: string, eventId: string) => Promise<any>;
  onDecisionAction?: (action: 'approve' | 'modify' | 'reject') => Promise<void>;
  onSelectScenario?: (scenarioId: string) => void;
}

export const PrimaryWorkspace: React.FC<PrimaryWorkspaceProps> = (props) => {
  const {
    selectedScenarioId,
    onNavigate,
    onOpenCopilot,
    onToggleMobileMenu,
    onSelectScenario
  } = props;

  const [localInputText, setLocalInputText] = useState<string>(TEMPLATE_INPUTS[0].text);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("SOLAR_DROP_60");
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [localAnalysis, setLocalAnalysis] = useState<UnifiedAnalysisResponse | null>(null);
  const [localDecisionState, setLocalDecisionState] = useState<'pending' | 'approved' | 'modified' | 'rejected'>('pending');
  const [localExecutionResult, setLocalExecutionResult] = useState<ExecutionResult | null>(null);
  const [localSubmittingAction, setLocalSubmittingAction] = useState<boolean>(false);
  const [localFeedbackMsg, setLocalFeedbackMsg] = useState<string | null>(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState<boolean>(false);
  const [twinModalOpen, setTwinModalOpen] = useState<boolean>(false);

  // Operational Input drawer toggle
  const [showInputDrawer, setShowInputDrawer] = useState<boolean>(false);

  // Recent activity logs
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Backend Health state
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [aiHealth, setAiHealth] = useState<AIHealthStatus | null>(null);

  // Flexible Load Override Controls for MODIFY mode
  const [localIsModifyMode, setLocalIsModifyMode] = useState<boolean>(false);
  const [localOverrideIcePlant, setLocalOverrideIcePlant] = useState<boolean>(false);
  const [localOverrideProcessing, setLocalOverrideProcessing] = useState<boolean>(false);

  const inputText = localInputText;
  const setInputText = setLocalInputText;
  const analysis = props.analysis !== undefined ? props.analysis : localAnalysis;
  const setAnalysis = props.setAnalysis || setLocalAnalysis;
  const loading = props.analysisLoading !== undefined ? props.analysisLoading : localLoading;
  const setLoading = setLocalLoading;
  const decisionState = props.decisionState !== undefined ? props.decisionState : localDecisionState;
  const setDecisionState = props.setDecisionState || setLocalDecisionState;
  const executionResult = props.executionResult !== undefined ? props.executionResult : localExecutionResult;
  const setExecutionResult = props.setExecutionResult || setLocalExecutionResult;
  const submittingAction = props.submittingAction !== undefined ? props.submittingAction : localSubmittingAction;
  const setSubmittingAction = setLocalSubmittingAction;
  const feedbackMsg = props.feedbackMsg !== undefined ? props.feedbackMsg : localFeedbackMsg;
  const setFeedbackMsg = props.setFeedbackMsg || setLocalFeedbackMsg;
  const isModifyMode = props.isModifyMode !== undefined ? props.isModifyMode : localIsModifyMode;
  const setIsModifyMode = props.setIsModifyMode || setLocalIsModifyMode;
  const overrideIcePlant = props.overrideIcePlant !== undefined ? props.overrideIcePlant : localOverrideIcePlant;
  const setOverrideIcePlant = props.setOverrideIcePlant || setLocalOverrideIcePlant;
  const overrideProcessing = props.overrideProcessing !== undefined ? props.overrideProcessing : localOverrideProcessing;
  const setOverrideProcessing = props.setOverrideProcessing || setLocalOverrideProcessing;

  // Check health and load recent logs on mount
  useEffect(() => {
    checkBackendHealth()
      .then((res) => setBackendConnected(res !== null && res.status === 'ok'))
      .catch(() => setBackendConnected(false));

    fetchAIHealth()
      .then((res) => setAiHealth(res))
      .catch(() => setAiHealth(null));

    loadRecentLogs();
  }, []);

  const loadRecentLogs = () => {
    setLoadingLogs(true);
    fetchAuditLogs()
      .then((res) => {
        setRecentLogs(res || []);
      })
      .catch(() => {
        setRecentLogs([]);
      })
      .finally(() => {
        setLoadingLogs(false);
      });
  };

  useEffect(() => {
    if (selectedScenarioId && selectedScenarioId !== selectedTemplateId) {
      const match = SCENARIO_CONFIGS.find((s) => s.id === selectedScenarioId);
      if (match) {
        setSelectedTemplateId(match.id);
        setInputText(match.text);
      }
    }
  }, [selectedScenarioId, selectedTemplateId]);

  const handleSelectTemplate = (tpl: ScenarioConfig) => {
    setSelectedTemplateId(tpl.id);
    setInputText(tpl.text);
    if (props.onSelectScenario) {
      props.onSelectScenario(tpl.id);
    }
    // Explicitly reset prior analysis results so stale state is never confused with a newly selected scenario
    setAnalysis(null);
    setExecutionResult(null);
    setDecisionState('pending');
    setFeedbackMsg(null);
    setIsModifyMode(false);
  };

  const handleRunAnalysis = async () => {
    if (!inputText.trim()) return;
    setFeedbackMsg(null);
    setDecisionState('pending');

    if (props.onRunAnalysis) {
      try {
        await props.onRunAnalysis(inputText, selectedTemplateId);
        setShowInputDrawer(false);
        loadRecentLogs();
      } catch (err) {
        // Error already handled in onRunAnalysis
      }
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setExecutionResult(null);
    setIsModifyMode(false);

    try {
      const res = await analyzeOperationalInput({
        input: inputText,
        event_type: selectedTemplateId
      });
      setAnalysis(res);
      if (!res.safety.approval_required) {
        setDecisionState('approved');
      }
      setShowInputDrawer(false);
      loadRecentLogs();
    } catch (err) {
      console.error('Error analyzing operational input:', err);
      setFeedbackMsg(`Operational analysis failed: ${err instanceof Error ? err.message : 'Network error'}. Check backend connectivity.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionAction = async (action: 'approve' | 'modify' | 'reject') => {
    if (props.onDecisionAction) {
      await props.onDecisionAction(action);
      loadRecentLogs();
      return;
    }

    if (!analysis) return;

    if (action === 'modify' && !isModifyMode) {
      setIsModifyMode(true);
      setFeedbackMsg('Modify Mode Active: Flexible non-critical loads may be adjusted. Life-critical aeration and refrigeration remain permanently protected.');
      return;
    }

    setSubmittingAction(true);
    setFeedbackMsg(null);

    try {
      const notes = isModifyMode
        ? `Operator Override: Ice Plant ${overrideIcePlant ? 'FORCE_ON' : 'DEFERRED'}, Processing ${overrideProcessing ? 'FORCE_ON' : 'DEFERRED'}`
        : undefined;

      const req: ApprovalRequest = {
        event_id: analysis.event_id,
        action,
        notes
      };

      const res = await postApproval(req);
      setExecutionResult(res);

      if (action === 'approve') {
        setDecisionState('approved');
        setFeedbackMsg('Plan Approved by Operator ✓ — Dispatched via Controlled Tool Gateway to PS04 Digital Twin. Critical loads protected in the Digital Twin.');
      } else if (action === 'modify') {
        setDecisionState('modified');
        setFeedbackMsg('Modified Plan Approved ✓ — Re-validated against Deterministic Safety Engine & Dispatched. Critical loads protected in the Digital Twin.');
      } else {
        setDecisionState('rejected');
        setFeedbackMsg('Execution cancelled (rejected) — zero equipment commands dispatched.');
      }

      await fetchDigitalTwinState().catch(() => null);
      loadRecentLogs();
    } catch (err) {
      console.error('Error dispatching decision:', err);
      setDecisionState('pending');
      setFeedbackMsg(`Backend execution failed: ${err instanceof Error ? err.message : 'Network error'}. Zero equipment commands dispatched.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const currentScenario =
    SCENARIO_CONFIGS.find((s) => s.id === selectedTemplateId) ||
    SCENARIO_CONFIGS[0];

  // Helper extraction of live telemetry from backend response
  const pondMetrics = analysis?.agents?.pond?.key_metrics || {};
  const energyMetrics = analysis?.agents?.energy?.key_metrics || {};
  const coldMetrics = analysis?.agents?.cold_chain?.key_metrics || {};

  const doValue = pondMetrics['Dissolved Oxygen'] || currentScenario.baselineTelemetry.doValue;
  const pondTemp = pondMetrics['Water Temp'] || currentScenario.baselineTelemetry.pondTemp;
  const solarGen = energyMetrics['Solar Output'] || currentScenario.baselineTelemetry.solarGen;
  const batterySoc = energyMetrics['Battery SOC'] || currentScenario.baselineTelemetry.batterySoc;
  const coldRoomTemp = coldMetrics['Cold Room Temp'] || currentScenario.baselineTelemetry.coldRoomTemp;

  // Derive scenario baseline demand and protected dispatch allocation
  const scenarioBaselineLoadKw = (() => {
    const match = inputText.match(/(?:Facility|Total)\s+load\s+is\s+([0-9.]+)\s*kW/i);
    if (match) return match[1];
    const matchEnergy = energyMetrics['Total Load']?.match(/([0-9.]+)/);
    if (matchEnergy) return matchEnergy[1];
    return currentScenario.baselineTelemetry.facilityLoadKw;
  })();

  const protectedDispatchKw = analysis
    ? (analysis.plan.protect.reduce((acc, p) => acc + (p.power_kw || 0), 0) +
       (overrideIcePlant ? 3.0 : 0) +
       (overrideProcessing ? 4.0 : 0)).toFixed(1)
    : null;

  const deferredKw = analysis
    ? analysis.plan.defer.reduce((acc, d) => acc + (d.power_kw || 0), 0).toFixed(1)
    : '0.0';

  const potentialSavingsInr = analysis
    ? (Number(deferredKw) * 2.5 * 9.5).toFixed(2)
    : '0.00';

  // Derive situation text and headline for Operational Attention card
  const situationTitle = analysis
    ? (analysis.event_title || currentScenario.bannerTitle)
    : currentScenario.bannerTitle;

  const situationDescription = analysis
    ? analysis.situation
    : currentScenario.description;

  const isAnalysisFailed = !loading && !analysis && !!feedbackMsg && feedbackMsg.toLowerCase().includes('fail');

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto pb-8 font-sans">

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. WELCOME HEADER (PIXEL MATCH REFERENCE SCREENSHOT)                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#D6F0FA] via-[#E6F5FA] to-[#EDF8FB] border border-[#BCE2EE] p-4 sm:p-5 shadow-xs">
        {/* Wide aquaculture/shrimp-pond illustration on the right side with a pale aqua gradient fading toward the left */}
        <div className="absolute inset-y-0 right-0 w-1/2 sm:w-4/5 md:w-2/3 lg:w-3/5 pointer-events-none overflow-hidden flex items-center justify-end opacity-90">
          <img
            src="/aquaculture_header_pond.svg"
            alt="Aquaculture Hatchery Pond Backdrop"
            className="h-full w-full object-cover object-right select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/clean_landscape.png';
            }}
          />
          {/* Pale aqua gradient overlay fading smoothly toward the left so greeting & controls remain crisp & readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#D6F0FA] via-[#D6F0FA]/40 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left Greeting & Mascot */}
          <div className="flex items-center gap-3.5">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="md:hidden p-2 rounded-xl bg-white/80 text-slate-700 hover:bg-white border border-[#BCE2EE] shadow-2xs transition"
                aria-label="Toggle Navigation Menu"
              >
                ☰
              </button>
            )}
            <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
              <img
                src="/shrimp_mascot.png"
                alt="AquaVolt Hatchery Mascot"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                Good morning, Hatchery Team
              </h1>
              <p className="text-xs sm:text-sm text-[#4E7684] font-medium mt-0.5">
                Your facility at a glance
              </p>
            </div>
          </div>

          {/* Right Header Controls (Backend Health, Copilot, Operator Avatar) */}
          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
            {/* Backend Connected Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs border transition ${
                backendConnected === true
                  ? 'bg-white/90 text-[#0E7A68] border-[#A8E6DC]'
                  : backendConnected === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white/80 text-slate-600 border-slate-200'
              }`}
              title={
                backendConnected === true
                  ? 'FastAPI Intelligence Layer operational'
                  : 'FastAPI backend unreachable'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendConnected === true
                    ? 'bg-[#12B5A4] animate-pulse'
                    : backendConnected === false
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px] font-bold">
                {backendConnected === true
                  ? 'Backend Connected'
                  : backendConnected === false
                  ? 'Backend Offline'
                  : 'Checking Backend'}
              </span>
            </div>

            {/* AI Gateway / Gemini Availability Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs border transition ${
                aiHealth?.ai_configured
                  ? 'bg-[#E6F8F6] text-[#0E7A68] border-[#A8E6DC]'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title={
                aiHealth?.ai_configured
                  ? 'Google Gemini 2.5 Flash active in AI Gateway'
                  : 'AI Gateway in Safe Deterministic Fallback mode (GEMINI_API_KEY not configured in backend)'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  aiHealth?.ai_configured ? 'bg-[#12B5A4]' : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px] font-semibold">
                {aiHealth?.ai_configured ? 'Gemini Available' : 'AI: Deterministic Fallback'}
              </span>
            </div>

            {/* AquaVolt Copilot Button */}
            <button
              type="button"
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 hover:bg-white text-[#103844] rounded-full text-xs font-semibold shadow-2xs border border-[#C5E4EE] transition"
            >
              <span className="text-sm">💬</span>
              <span>Copilot</span>
            </button>

            {/* Hatchery Team Avatar Menu Pill */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#103844] text-white rounded-full text-xs font-bold shadow-2xs">
              <span className="text-[11px] font-black tracking-wider">HT</span>
              <span className="text-[9px] text-[#A2E6DE]">▼</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. HATCHERY OPERATIONAL TELEMETRY (6 METRIC CARDS)                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-[#D5EBF1] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#E6F8F6] text-[#0F9F8F] flex items-center justify-center font-bold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#103844] tracking-tight">
                Hatchery Operational Telemetry
              </h2>
              <p className="text-[11px] text-[#5A7E8C] font-medium">
                Scenario Telemetry · Digital Twin microgrid model • Visakhapatnam Unit 1
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E6F8F3] text-[#0E7A68] border border-[#BCEADB]"
            title="Operator-provided scenario telemetry · Simulated Digital Twin model · No physical hardware connected"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B5A4] animate-pulse" />
            Scenario Telemetry · Digital Twin
          </div>
        </div>

        {/* 6 Equal-Height Metric Cards matching Reference Screenshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3.5">
          {/* Card 1: Pond Oxygen */}
          <div className="bg-[#FAFDFE] rounded-xl border border-[#E1F1F5] p-3.5 flex flex-col justify-between hover:border-[#12B5A4]/40 transition">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#103844]">
              <span className="text-[#159F90] text-sm">≈</span>
              <span className="truncate">Pond Oxygen</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                {doValue}
              </div>
              <div className="text-[10px] text-[#5A7E8C] font-medium mt-0.5">
                Target: &gt; 4.0 mg/L
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                (currentScenario.id === 'POND_DO_FALLING' || (!isNaN(parseFloat(doValue)) && parseFloat(doValue) < 4.0))
                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                  : currentScenario.id === 'SOLAR_DROP_60'
                  ? 'bg-[#FEF3E2] text-[#B45309] border-[#FDE68A]'
                  : 'bg-[#EBF9F3] text-[#0F766E] border-[#A7F3D0]'
              }`}>
                {(currentScenario.id === 'POND_DO_FALLING' || (!isNaN(parseFloat(doValue)) && parseFloat(doValue) < 4.0))
                  ? '↓ Critical'
                  : currentScenario.id === 'SOLAR_DROP_60'
                  ? '↓ Falling'
                  : '✓ Safe'}
              </span>
            </div>
          </div>

          {/* Card 2: Pond Temperature */}
          <div className="bg-[#FAFDFE] rounded-xl border border-[#E1F1F5] p-3.5 flex flex-col justify-between hover:border-[#12B5A4]/40 transition">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#103844]">
              <span className="text-[#0284C7] text-sm">🌡️</span>
              <span className="truncate">Pond Temperature</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                {pondTemp}
              </div>
              <div className="text-[10px] text-[#5A7E8C] font-medium mt-0.5">
                Optimal: 26–30 °C
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF9F3] text-[#0F766E] border border-[#A7F3D0]">
                ✓ Within range
              </span>
            </div>
          </div>

          {/* Card 3: Solar Generation */}
          <div className="bg-[#FAFDFE] rounded-xl border border-[#E1F1F5] p-3.5 flex flex-col justify-between hover:border-[#12B5A4]/40 transition">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#103844]">
              <span className="text-[#EA580C] text-sm">☀️</span>
              <span className="truncate">Solar Generation</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                {solarGen}
              </div>
              <div className="text-[10px] text-[#5A7E8C] font-medium mt-0.5">
                Peak: 18.4 kW
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentScenario.id === 'SOLAR_DROP_60'
                  ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                  : currentScenario.id === 'GRID_FAILURE'
                  ? 'bg-[#FEF3E2] text-[#B45309] border-[#FDE68A]'
                  : currentScenario.id === 'SOLAR_NORMAL'
                  ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                  : 'bg-[#EBF9F3] text-[#0F766E] border-[#A7F3D0]'
              }`}>
                {currentScenario.id === 'SOLAR_DROP_60'
                  ? '↓ Reduced'
                  : currentScenario.id === 'GRID_FAILURE'
                  ? '≈ Standby'
                  : currentScenario.id === 'SOLAR_NORMAL'
                  ? '↑ Surplus'
                  : '✓ Normal'}
              </span>
            </div>
          </div>

          {/* Card 4: Battery SOC */}
          <div className="bg-[#FAFDFE] rounded-xl border border-[#E1F1F5] p-3.5 flex flex-col justify-between hover:border-[#12B5A4]/40 transition">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#103844]">
              <span className="text-[#059669] text-sm">🔋</span>
              <span className="truncate">Battery SOC</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                {batterySoc}
              </div>
              <div className="text-[10px] text-[#5A7E8C] font-medium mt-0.5">
                Reserve floor: ≥ 20%
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentScenario.id === 'SOLAR_DROP_60' || currentScenario.id === 'GRID_FAILURE'
                  ? 'bg-[#FEF3E2] text-[#B45309] border-[#FDE68A]'
                  : 'bg-[#EBF9F3] text-[#0F766E] border-[#A7F3D0]'
              }`}>
                {currentScenario.id === 'SOLAR_DROP_60'
                  ? '↓ Low reserve'
                  : currentScenario.id === 'GRID_FAILURE'
                  ? '⚡ Island draw'
                  : '✓ Normal'}
              </span>
            </div>
          </div>

          {/* Card 5: Cold Room Temp */}
          <div className="bg-[#FAFDFE] rounded-xl border border-[#E1F1F5] p-3.5 flex flex-col justify-between hover:border-[#12B5A4]/40 transition">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#103844]">
              <span className="text-[#2563EB] text-sm">❄️</span>
              <span className="truncate">Cold Room Temp</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                {coldRoomTemp}
              </div>
              <div className="text-[10px] text-[#5A7E8C] font-medium mt-0.5">
                Range: 2.0–5.0 °C
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF9F3] text-[#0F766E] border border-[#A7F3D0]">
                ✓ Safe range
              </span>
            </div>
          </div>

          {/* Card 6: Facility Load */}
          <div className="bg-[#FAFDFE] rounded-xl border border-[#E1F1F5] p-3.5 flex flex-col justify-between hover:border-[#12B5A4]/40 transition">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#103844]">
              <span className="text-[#D97706] text-sm">⚡</span>
              <span className="truncate">Facility Load</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#103844] tracking-tight">
                {scenarioBaselineLoadKw} kW
              </div>
              <div className="text-[10px] text-[#5A7E8C] font-medium mt-0.5 truncate" title={analysis ? `Protected dispatch load: ${protectedDispatchKw} kW` : 'Scenario baseline demand'}>
                {analysis ? `Protected dispatch: ${protectedDispatchKw} kW` : 'Scenario demand'}
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                analysis
                  ? 'bg-[#EBF9F3] text-[#0F766E] border-[#A7F3D0]'
                  : 'bg-[#EBF4FA] text-[#0369A1] border-[#BAE6FD]'
              }`}>
                {analysis ? '✓ Load Managed' : '≈ Baseline'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. ASYMMETRICAL 2-COLUMN SECTION: ATTENTION + TODAY'S OPERATIONS             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Operational Attention Card - Compact, Top-Aligned 2-Column Layout */}
        <section className="lg:col-span-8 bg-[#FFF9EE] border border-[#FBE3B5] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
          {/* Top Label & Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full text-white flex items-center justify-center font-black text-[10px] ${
                analysis
                  ? (analysis.safety.approval_required ? 'bg-[#F59E0B]' : 'bg-[#10B981]')
                  : (currentScenario.id === 'NORMAL_OPERATION' || currentScenario.id === 'SOLAR_NORMAL' ? 'bg-[#10B981]' : 'bg-[#F59E0B]')
              }`}>
                {analysis ? (analysis.safety.approval_required ? '!' : '✓') : (currentScenario.id === 'NORMAL_OPERATION' || currentScenario.id === 'SOLAR_NORMAL' ? '✓' : '!')}
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                analysis
                  ? (analysis.safety.approval_required ? 'text-[#B45309]' : 'text-[#0E7A68]')
                  : (currentScenario.id === 'NORMAL_OPERATION' || currentScenario.id === 'SOLAR_NORMAL' ? 'text-[#0E7A68]' : 'text-[#B45309]')
              }`}>
                {currentScenario.id === 'NORMAL_OPERATION'
                  ? 'SYSTEM STATUS · NOMINAL'
                  : currentScenario.id === 'SOLAR_NORMAL'
                  ? 'OPERATIONAL OPPORTUNITY'
                  : 'OPERATIONAL ATTENTION'}
              </span>
            </div>

            {/* Status Label - 4 distinct states */}
            {loading ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-50 text-sky-800 border-sky-200 animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                • Evaluating Pipeline...
              </span>
            ) : analysis ? (
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                analysis.safety.approval_required
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${analysis.safety.approval_required ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                • Analysis Complete · {analysis.safety.approval_required ? `Mandatory Sign-Off (Risk ${analysis.risk.score}/100)` : `Auto-Safe Permitted (Risk ${analysis.risk.score}/100)`}
              </span>
            ) : isAnalysisFailed ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-800 border-rose-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                • Analysis Failed
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-[#FEF3E2] text-[#B45309] border-[#FDE68A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                • Ready to analyze
              </span>
            )}
          </div>

          {/* Quick Scenario Selector Chips */}
          <div className="flex flex-wrap items-center gap-1.5 py-1.5 mb-2.5 border-b border-[#FBE3B5]/60">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A7E8C] mr-0.5">
              Select Scenario:
            </span>
            {SCENARIO_CONFIGS.map((s) => {
              const isSelected = selectedTemplateId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectTemplate(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#103844] text-white shadow-2xs'
                      : 'bg-white/90 hover:bg-white text-[#103844] border border-[#FBE3B5] hover:border-[#12B5A4]'
                  }`}
                  title={s.summary}
                >
                  <span className="text-xs">{s.icon}</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{s.name.split('+')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* 2-Column Grid: Left Content (tightly spaced), Right Illustration */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Left 8 cols: Heading, narrative, telemetry summary / completed analysis card, action buttons */}
            <div className="sm:col-span-7 md:col-span-8 space-y-2.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#103844] tracking-tight leading-snug">
                {situationTitle}
              </h3>

              <p className="text-xs sm:text-sm text-[#4E7684] font-medium leading-relaxed">
                {situationDescription}
              </p>

              {/* State 1: Ready to analyze - show telemetry summary chip */}
              {!analysis && !loading && !isAnalysisFailed && (
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-semibold text-[#5A7E8C] bg-white/90 border border-[#FBE3B5] px-2.5 py-1 rounded-lg shadow-2xs">
                    📊 {currentScenario.telemetrySummary}
                  </span>
                </div>
              )}

              {/* State 2: Evaluating Pipeline - loading notice */}
              {loading && (
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-semibold text-sky-800 bg-sky-50/80 border border-sky-200 px-2.5 py-1 rounded-lg animate-pulse">
                    ⚡ Dispatching telemetry through 4 specialist agents & deterministic safety validator...
                  </span>
                </div>
              )}

              {/* State 3: Analysis Completed - show actual backend response fields */}
              {analysis && !loading && (
                <div className="p-2.5 rounded-xl bg-white/95 border border-emerald-200/90 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-950 flex items-start gap-1.5">
                    <span className="text-xs shrink-0">🛡️</span>
                    <span><strong>Recommendation:</strong> {analysis.orchestration.reasoning_summary}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      analysis.risk.score >= 70
                        ? 'bg-rose-100 text-rose-800'
                        : analysis.risk.score >= 40
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Risk: {analysis.risk.score}/100 ({analysis.risk.level})
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      analysis.safety.approval_required
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {analysis.safety.approval_required ? 'Operator Sign-Off Required' : 'Auto-Safe Authorized'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold">
                      Potential Avoided: ₹{potentialSavingsInr}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-bold">
                      Protected: {protectedDispatchKw} kW · Deferred: {deferredKw} kW
                    </span>
                  </div>
                </div>
              )}

              {/* State 4: Analysis Failed - show error alert */}
              {isAnalysisFailed && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <span>⚠️</span>
                    <span>Operational Analysis Failed</span>
                  </div>
                  <div>{feedbackMsg}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#0F9F8F] hover:bg-[#0D877A] text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-xs group disabled:opacity-50"
                  title="Submit current scenario to backend POST /api/analyze"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating Microgrid Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Analyze with AquaVolt</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowInputDrawer(!showInputDrawer)}
                  className="px-3.5 py-2.5 bg-white hover:bg-amber-100/50 text-[#B45309] font-bold text-xs rounded-xl border border-[#FBE3B5] transition shadow-2xs"
                >
                  {showInputDrawer ? 'Hide Scenario Details ▲' : 'Inspect Input Data ▼'}
                </button>
              </div>
            </div>

            {/* Right 4-5 cols: Center-aligned Illustration matching current scenario */}
            <div className="sm:col-span-5 md:col-span-4 flex justify-center sm:justify-end items-center">
              <div className="w-32 sm:w-40 h-24 sm:h-28 flex items-center justify-center p-1 bg-white/40 rounded-xl border border-[#FBE3B5]/50">
                <img
                  src={currentScenario.illustration}
                  alt={currentScenario.illustrationAlt}
                  className="max-w-full max-h-full object-contain filter drop-shadow-xs transition-opacity duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/solar_pond_art.png') {
                      target.src = '/solar_pond_art.png';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Today's Operations Card (Pond health, Energy, Cold storage) */}
        <section className="lg:col-span-4 bg-white border border-[#D5EBF1] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">📅</span>
              <h3 className="text-sm font-extrabold text-[#103844] tracking-tight">
                Today's operations
              </h3>
            </div>
            <span className="text-[11px] text-[#5A7E8C] font-semibold">
              Scenario status
            </span>
          </div>

          <div className="space-y-3">
            {/* Row 1: Pond health */}
            <div
              onClick={() => onNavigate && onNavigate('agents')}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base text-[#159F90] shrink-0">≈</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#103844] truncate">Pond health</div>
                  <div className="text-[11px] text-[#5A7E8C] truncate font-medium">
                    {currentScenario.id === 'POND_DO_FALLING'
                      ? 'Critical DO deficit (2.9 mg/L)'
                      : currentScenario.id === 'SOLAR_DROP_60'
                      ? 'Oxygen below target'
                      : 'Dissolved oxygen optimal'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  currentScenario.id === 'POND_DO_FALLING'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : currentScenario.id === 'SOLAR_DROP_60'
                    ? 'bg-[#FEF3E2] text-[#B45309] border-[#FDE68A]'
                    : 'bg-[#EBF9F3] text-[#0F766E] border-[#A7F3D0]'
                }`}>
                  {currentScenario.id === 'POND_DO_FALLING'
                    ? 'Critical DO'
                    : currentScenario.id === 'SOLAR_DROP_60'
                    ? 'Needs attention'
                    : '✓ Optimal'}
                </span>
                <span className="text-slate-400 text-xs">›</span>
              </div>
            </div>

            {/* Row 2: Energy & microgrid */}
            <div
              onClick={() => onNavigate && onNavigate('twin')}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base text-[#EA580C] shrink-0">☀️</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#103844] truncate">Energy & microgrid</div>
                  <div className="text-[11px] text-[#5A7E8C] truncate font-medium">
                    {currentScenario.id === 'GRID_FAILURE'
                      ? 'Grid offline — Island mode'
                      : currentScenario.id === 'SOLAR_DROP_60'
                      ? 'Reduced solar generation (-60%)'
                      : currentScenario.id === 'SOLAR_NORMAL'
                      ? 'Surplus solar output (+7.2 kW)'
                      : 'Microgrid balanced'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  currentScenario.id === 'GRID_FAILURE'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : currentScenario.id === 'SOLAR_DROP_60'
                    ? 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                    : currentScenario.id === 'SOLAR_NORMAL'
                    ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                    : 'bg-[#EBF9F3] text-[#0F766E] border-[#A7F3D0]'
                }`}>
                  {currentScenario.id === 'GRID_FAILURE'
                    ? 'Island Mode'
                    : currentScenario.id === 'SOLAR_DROP_60'
                    ? 'Reduced solar'
                    : currentScenario.id === 'SOLAR_NORMAL'
                    ? '↑ Surplus'
                    : '✓ Nominal'}
                </span>
                <span className="text-slate-400 text-xs">›</span>
              </div>
            </div>

            {/* Row 3: Cold storage */}
            <div
              onClick={() => onNavigate && onNavigate('twin')}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base text-[#2563EB] shrink-0">❄️</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#103844] truncate">Cold storage</div>
                  <div className="text-[11px] text-[#5A7E8C] truncate font-medium">
                    {currentScenario.id === 'SOLAR_NORMAL'
                      ? 'Thermal pre-cooling window active'
                      : 'Temperature stable (2.0–5.0 °C)'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF9F3] text-[#0F766E] border border-[#A7F3D0]">
                  {currentScenario.id === 'SOLAR_NORMAL' ? '❄ Pre-Cool' : '✓ Stable'}
                </span>
                <span className="text-slate-400 text-xs">›</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. EXPANDABLE OPERATIONAL INPUT & SCENARIO SELECTION                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showInputDrawer && (
        <section className="bg-white border border-[#BCE2EE] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2.5 border-b border-sky-50">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#103844] tracking-tight">
                Operational Input & Calibrated Scenarios
              </h3>
              <p className="text-[11px] text-[#5A7E8C] font-medium">
                Select field conditions or enter real-time observations to dispatch through the 4-agent pipeline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInputDrawer(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              ✕ Close Input Panel
            </button>
          </div>

          {/* Grid of 5 primary presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {TEMPLATE_INPUTS.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-left transition duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-50/80 border-[#12B5A4] ring-2 ring-[#12B5A4]/30 text-slate-900 shadow-xs'
                      : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm shrink-0">{tpl.icon}</span>
                      <span className="text-xs font-bold leading-snug line-clamp-1">{tpl.name}</span>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full shrink-0 ${
                      isSelected ? 'bg-sky-200/80 text-sky-900' : 'bg-white text-slate-600 border border-slate-200'
                    }`}>
                      {tpl.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {tpl.summary}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notice when preset selected */}
          {!analysis && !loading && (
            <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-900 font-medium flex items-center justify-between">
              <span>Scenario loaded: <strong>{TEMPLATE_INPUTS.find(t => t.id === selectedTemplateId)?.name}</strong></span>
              <span className="text-[11px] text-sky-700 font-semibold">Click "Analyze with AquaVolt" to run evaluation</span>
            </div>
          )}

          {/* Textarea & Run */}
          <div className="space-y-2 pt-1">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter real-time telemetry observation..."
              className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#12B5A4] focus:bg-white transition"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={loading || !inputText.trim()}
                className="px-5 py-2.5 bg-[#0F9F8F] hover:bg-[#0D877A] text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Microgrid Telemetry...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Analyze with AquaVolt</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. ANALYSIS RESULT & INSEPARABLE DECISION CONTROLS (WHEN ANALYZED)          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {analysis && (
        <section className="bg-white border border-[#D5EBF1] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h3 className="text-sm sm:text-base font-extrabold text-[#103844] tracking-tight">
                  Recommended Action Plan: {analysis.event_title}
                </h3>
                {analysis.analysis_id && (
                  <span className="text-[10px] font-mono font-bold bg-[#E6F8F6] text-[#0E7A68] px-2 py-0.5 rounded">
                    ID: {analysis.analysis_id}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5A7E8C] font-medium mt-0.5">
                Risk Score: <strong className="text-slate-800">{analysis.risk.score}/100</strong> ({analysis.risk.level}) · Safety Invariants: <strong className="text-slate-800">{analysis.safety.policies_passed}/{analysis.safety.policies_checked} Verified</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('agents')}
                className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-lg border border-sky-200 transition"
              >
                Inspect 4 Specialists Trace →
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('governance')}
                className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200 transition"
              >
                Governance Matrix →
              </button>
            </div>
          </div>

          {/* Operational Context & Risk Drivers */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium space-y-1">
            <div><strong>Operational Situation:</strong> {analysis.situation}</div>
            {analysis.risk.reasons && analysis.risk.reasons.length > 0 && (
              <div className="text-[11px] text-[#4E7684]">
                <strong>Primary Risk Drivers:</strong> {analysis.risk.reasons.join(' · ')}
              </div>
            )}
          </div>

          {/* 3 Columns: PROTECT · OPTIMIZE · DEFER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: PROTECT */}
            <div className="bg-[#FAFDFE] border border-teal-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-teal-200/60">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1">
                  <span>🔒</span> PROTECT (Life-Critical)
                </span>
                <span className="text-[9px] font-bold text-teal-700 bg-white px-1.5 py-0.2 rounded-full border border-teal-200">
                  Locked
                </span>
              </div>
              <div className="space-y-2">
                {analysis.plan.protect.map((item) => (
                  <div key={item.id} className="bg-white p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <div className="flex justify-between items-start gap-1">
                      <div className="font-bold text-slate-900 text-xs leading-snug">{item.title}</div>
                      <span className="text-[9px] font-bold font-mono text-teal-700 bg-teal-50 px-1 py-0.5 rounded shrink-0">
                        {item.power_kw > 0 ? `${item.power_kw} kW` : 'Active'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: OPTIMIZE */}
            <div className="bg-[#FAFDFE] border border-sky-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-sky-200/60">
                <span className="text-xs font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1">
                  <span>⚡</span> OPTIMIZE (Microgrid)
                </span>
                <span className="text-[9px] font-bold text-sky-700 bg-white px-1.5 py-0.2 rounded-full border border-sky-200">
                  Dynamic
                </span>
              </div>
              <div className="space-y-2">
                {analysis.plan.energy_strategy.map((item) => (
                  <div key={item.id} className="bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs">
                    <div className="flex justify-between items-start gap-1">
                      <div className="font-bold text-slate-900 text-xs leading-snug">{item.title}</div>
                      <span className="text-[9px] font-bold font-mono text-sky-700 bg-sky-50 px-1 py-0.5 rounded shrink-0">
                        {item.power_kw > 0 ? `${item.power_kw} kW` : 'Dynamic'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: DEFER */}
            <div className="bg-[#FAFDFE] border border-amber-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                  <span>⏸</span> DEFER (Auxiliary)
                </span>
                <span className="text-[9px] font-bold text-amber-800 bg-white px-1.5 py-0.2 rounded-full border border-amber-200">
                  Paused
                </span>
              </div>
              <div className="space-y-2">
                {analysis.plan.defer.map((item) => (
                  <div key={item.id} className="bg-white p-2.5 rounded-lg border border-amber-100 shadow-2xs">
                    <div className="flex justify-between items-start gap-1">
                      <div className="font-bold text-slate-900 text-xs leading-snug">{item.title}</div>
                      <span className="text-[9px] font-bold font-mono text-amber-800 bg-amber-50 px-1 py-0.5 rounded shrink-0">
                        Paused
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-snug">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modify Controls when active */}
          {isModifyMode && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>✎</span> Flexible Auxiliary Load Overrides
                </div>
                <button
                  type="button"
                  onClick={() => setIsModifyMode(false)}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
                >
                  Cancel Override
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-amber-200 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={overrideIcePlant}
                    onChange={(e) => setOverrideIcePlant(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Force Run Ice Plant (+3.0 kW)</div>
                    <div className="text-[10px] text-slate-500">Draws additional power from battery reserve</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-amber-200 cursor-pointer shadow-2xs">
                  <input
                    type="checkbox"
                    checked={overrideProcessing}
                    onChange={(e) => setOverrideProcessing(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Force Run Processing Plant (+4.0 kW)</div>
                    <div className="text-[10px] text-slate-500">Permitted only if battery remains &gt; 25%</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Inseparable Decision Controls */}
          {analysis.safety.approval_required && decisionState === 'pending' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDecisionAction('approve')}
                disabled={submittingAction}
                className="py-2.5 px-4 bg-[#0F9F8F] hover:bg-[#0D877A] text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
              >
                {submittingAction ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>✓ APPROVE PLAN</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDecisionAction('modify')}
                disabled={submittingAction}
                className="py-2.5 px-4 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>✎ {isModifyMode ? 'CONFIRM MODIFIED PLAN' : 'MODIFY FLEXIBLE LOADS'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionAction('reject')}
                disabled={submittingAction}
                className="py-2.5 px-4 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                title="Rejection dispatches zero commands to equipment and produces zero execution impact"
              >
                <span>✕ REJECT PROPOSAL</span>
              </button>
            </div>
          )}

          {!analysis.safety.approval_required && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <span><strong>AUTO-SAFE CLEARED:</strong> All 9 deterministic safety invariants passed. Low risk operating autonomously.</span>
              </div>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                AUTO-SAFE
              </span>
            </div>
          )}

          {decisionState !== 'pending' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium flex items-center justify-between">
              <span>Decision recorded: <strong>{decisionState.toUpperCase()}</strong></span>
              <span className="text-[11px] text-slate-500 font-mono">
                {decisionState === 'rejected' ? 'Zero commands dispatched · No execution impact' : 'Dispatched to Digital Twin'}
              </span>
            </div>
          )}

          {feedbackMsg && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${
              decisionState === 'rejected'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {feedbackMsg}
            </div>
          )}
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. RECENT ACTIVITY (PIXEL MATCH REFERENCE SCREENSHOT)                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-[#D5EBF1] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-base">
              🕒
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#103844] tracking-tight">
                Recent activity
              </h2>
              <p className="text-[11px] text-[#5A7E8C] font-medium">
                Latest analyses, decisions and system events
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('audit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#103844] hover:bg-slate-50 border border-slate-200 transition shadow-2xs"
          >
            <span>📜</span>
            <span>View full audit trail</span>
            <span>→</span>
          </button>
        </div>

        {/* Dynamic Activity List or Graceful Illustrated Empty State */}
        {recentLogs.length > 0 ? (
          <div className="space-y-2 pt-1">
            {recentLogs.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 transition text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    log.action_taken === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                    log.action_taken === 'MODIFY' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {log.action_taken}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[#103844] truncate">{log.event_title}</div>
                    <div className="text-[11px] text-[#5A7E8C] truncate font-medium">
                      {log.summary}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  {log.action_taken === 'REJECTED' || log.action_taken === 'reject' || (log.impact && log.impact.cost_avoided_inr === 0 && log.impact.energy_optimized_kwh === 0) ? (
                    <div className="font-mono text-[11px] text-slate-400 font-medium">
                      — (No execution impact)
                    </div>
                  ) : (
                    <div className="font-mono text-[11px] text-emerald-700 font-bold">
                      ₹{log.impact.cost_avoided_inr.toFixed(2)} Avoided
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono">
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Graceful Illustrated Empty State Matching Reference Screenshot */
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-36 h-16 flex items-center justify-center">
              <img
                src="/empty_pond.png"
                alt="Pond ripples"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#103844]">
                No recent analysis yet
              </h4>
              <p className="text-[11px] text-[#5A7E8C] font-medium mt-0.5">
                Run an analysis to see recommendations and audit details.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Global Modals */}
      <SafetyMatrixModal isOpen={safetyModalOpen} onClose={() => setSafetyModalOpen(false)} />
      <PS04DigitalTwinModal
        isOpen={twinModalOpen}
        onClose={() => setTwinModalOpen(false)}
        plan={null}
        telemetry={null}
        twinState={null}
      />
    </div>
  );
};
