import React, { useEffect, useState } from 'react';
import { Sidebar, MainNavDestination } from './components/Sidebar';
import { Header } from './components/Header';
import { PrimaryWorkspace } from './components/workspace/PrimaryWorkspace';
import { AgentOperationsView } from './components/workspace/AgentOperationsView';
import { GovernanceView } from './components/workspace/GovernanceView';
import { AuditTrailView } from './components/workspace/AuditTrailView';
import { PS04RigView } from './components/PS04RigView';
import { AuditLogModal } from './components/AuditLogModal';
import { CopilotModal } from './components/CopilotModal';

import { IoTEvent, ActionPlan, FarmState, UnifiedAnalysisResponse, ExecutionResult } from './types';
import { fetchEvents, analyzeOperationalInput, postApproval, fetchDigitalTwinState } from './services/api';

export const App: React.FC = () => {
  // Navigation: 5 Primary Destinations
  const [activeView, setActiveView] = useState<MainNavDestination>('facility');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Shared Operational Telemetry & Pipeline States
  const [events, setEvents] = useState<IoTEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('SOLAR_DROP_60');
  const [activeFarmState, setActiveFarmState] = useState<FarmState | null>(null);
  const [digitalTwinState, setDigitalTwinState] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<ActionPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shared Analysis & Governance State (so Agent Operations & Governance reflect current live state)
  const [analysis, setAnalysis] = useState<UnifiedAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [decisionState, setDecisionState] = useState<'pending' | 'approved' | 'modified' | 'rejected'>('pending');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [expandedSpecialist, setExpandedSpecialist] = useState<string | null>(null);

  // Flexible Load Override Controls for MODIFY mode
  const [isModifyMode, setIsModifyMode] = useState<boolean>(false);
  const [overrideIcePlant, setOverrideIcePlant] = useState<boolean>(false);
  const [overrideProcessing, setOverrideProcessing] = useState<boolean>(false);

  // Modals
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Initial Load: Fetch events & pre-activate default event analysis
  useEffect(() => {
    fetchEvents()
      .then((data) => {
        setEvents(data);
      })
      .catch(() => {
        setErrorMessage('Unable to process telemetry. Retry.');
      });

    // Run baseline analysis for initial state
    runBaselineAnalysis('Solar generation dropped 60%. Battery SOC is 38%. Pond DO is 4.2 mg/L and falling. Cold room is 4.3°C. Facility load is 18.3 kW. Grid is available.', 'SOLAR_DROP_60');
  }, []);

  const handleRunAnalysis = async (text: string, eventType: string) => {
    setAnalysisLoading(true);
    setAnalysis(null);
    setExecutionResult(null);
    setDecisionState('pending');
    setFeedbackMsg(null);
    setIsModifyMode(false);
    setErrorMessage(null);

    try {
      const res = await analyzeOperationalInput({ input: text, event_type: eventType });
      setAnalysis(res);
      setSelectedEventId(res.event_id || eventType);
      if (!res.safety.approval_required) {
        setDecisionState('approved');
      }
      return res;
    } catch (err) {
      console.error('Error running operational analysis:', err);
      const msg = `Analysis failed: ${err instanceof Error ? err.message : 'Network error'}. Check backend connectivity.`;
      setErrorMessage(msg);
      setFeedbackMsg(msg);
      throw err;
    } finally {
      setAnalysisLoading(false);
    }
  };

  const runBaselineAnalysis = (text: string, eventType: string) => {
    handleRunAnalysis(text, eventType).catch(() => {});
  };

  const handleDecisionAction = async (action: 'approve' | 'modify' | 'reject') => {
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

      const res = await postApproval({
        event_id: analysis.event_id,
        action,
        notes,
      });

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
    } catch (err) {
      console.error('Error dispatching decision:', err);
      setDecisionState('pending');
      setFeedbackMsg(`Backend execution failed: ${err instanceof Error ? err.message : 'Network error'}. Zero equipment commands dispatched.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const selectedEvent =
    events.find((e) => e.id.toUpperCase() === selectedEventId.toUpperCase()) || events[0];
  const telemetry = activeFarmState?.telemetry || selectedEvent?.telemetry;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F6FAFC] text-[#183344] p-2 sm:p-3 font-sans flex flex-col md:flex-row">
      {/* Persistent Left Sidebar (Fixed on tablet & desktop, drawer on mobile) */}
      <Sidebar
        activeView={activeView}
        onSwitchView={setActiveView}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Control Console Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden space-y-2.5">
        {/* Top Header - Rendered on secondary views (Agents, Governance, Twin, Audit); Facility Overview has the pixel-matched reference welcome banner */}
        {activeView !== 'facility' && (
          <Header
            activeView={activeView}
            onNavigate={setActiveView}
            onOpenAuditLog={() => setActiveView('audit')}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        )}

        {/* Clean Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-xs">
            <span className="font-semibold">⚠️ {errorMessage}</span>
          </div>
        )}

        {/* 5 Primary Destination Views */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {activeView === 'facility' && (
            <PrimaryWorkspace
              selectedScenarioId={selectedEventId}
              onNavigate={setActiveView}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
              analysis={analysis}
              setAnalysis={setAnalysis}
              analysisLoading={analysisLoading}
              decisionState={decisionState}
              setDecisionState={setDecisionState}
              executionResult={executionResult}
              setExecutionResult={setExecutionResult}
              submittingAction={submittingAction}
              feedbackMsg={feedbackMsg}
              setFeedbackMsg={setFeedbackMsg}
              isModifyMode={isModifyMode}
              setIsModifyMode={setIsModifyMode}
              overrideIcePlant={overrideIcePlant}
              setOverrideIcePlant={setOverrideIcePlant}
              overrideProcessing={overrideProcessing}
              setOverrideProcessing={setOverrideProcessing}
              onRunAnalysis={handleRunAnalysis}
              onDecisionAction={handleDecisionAction}
              onSelectScenario={setSelectedEventId}
            />
          )}

          {activeView === 'agents' && (
            <AgentOperationsView
              analysis={analysis}
              loading={analysisLoading}
              onRunAnalysis={() =>
                handleRunAnalysis(
                  analysis?.raw_input ||
                    'Solar generation dropped 60%. Battery SOC is 38%. Pond DO is 4.2 mg/L and falling. Cold room is 4.3°C. Facility load is 18.3 kW. Grid is available.',
                  selectedEventId
                )
              }
              expandedSpecialist={expandedSpecialist}
              onToggleSpecialist={(id) =>
                setExpandedSpecialist(expandedSpecialist === id ? null : id)
              }
              decisionState={decisionState}
              executionResult={executionResult}
            />
          )}

          {activeView === 'governance' && (
            <GovernanceView
              analysis={analysis}
              decisionState={decisionState}
              submittingAction={submittingAction}
              onDecisionAction={handleDecisionAction}
              isModifyMode={isModifyMode}
              setIsModifyMode={setIsModifyMode}
              overrideIcePlant={overrideIcePlant}
              setOverrideIcePlant={setOverrideIcePlant}
              overrideProcessing={overrideProcessing}
              setOverrideProcessing={setOverrideProcessing}
              feedbackMsg={feedbackMsg}
              executionResult={executionResult}
              onSwitchToOverview={() => setActiveView('facility')}
            />
          )}

          {activeView === 'twin' && (
            <PS04RigView
              plan={currentPlan}
              telemetry={telemetry || null}
              twinState={digitalTwinState}
              analysis={analysis}
              executionResult={executionResult}
              decisionState={decisionState}
            />
          )}

          {activeView === 'audit' && (
            <AuditTrailView />
          )}
        </div>
      </main>

      {/* Global Modals */}
      <AuditLogModal isOpen={isAuditLogOpen} onClose={() => setIsAuditLogOpen(false)} />
      <CopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentEventId={selectedEventId}
      />
    </div>
  );
};

export default App;
