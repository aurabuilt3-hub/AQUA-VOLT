"""AquaVolt Governance Audit Trail (Phase 18, adapted from AgentShield).

Records comprehensive operational traces across all lifecycle stages:
IoT Event → State Normalization → Specialist Agents → Risk Agent → Orchestrator →
Decision Engine → Safety Policy → Human Approval → Tool Gateway → Digital Twin → Impact.
"""

from typing import Dict, Any, List, Optional
import time
import datetime
import uuid
from pydantic import BaseModel, Field


class ComprehensiveAuditEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"aud_{uuid.uuid4().hex[:10]}")
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    component: str  # e.g. "IoT_Telemetry", "State_Engine", "Pond_Agent", "Energy_Agent", "Cold_Agent", "Risk_Agent", "Orchestrator", "Decision_Engine", "Safety_Policy", "Human_Approval", "Tool_Gateway", "Digital_Twin", "Impact_Engine"
    event_type: str  # e.g. "INGEST", "ANALYSIS", "PLAN_GENERATION", "POLICY_CHECK", "APPROVAL_REQUEST", "APPROVAL_DECISION", "TOOL_EXECUTION", "TWIN_UPDATE"
    event_id: str = "SOLAR_DROP_60"
    status: str = "SUCCESS"  # "SUCCESS", "BLOCKED", "REPAIRED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "MODIFIED", "WARNING", "FAILED"
    title: str = ""
    summary: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GovernanceAuditLogger:
    def __init__(self):
        self._events: List[ComprehensiveAuditEvent] = []

    def log(
        self,
        component: str,
        event_type: str,
        event_id: str,
        title: str,
        summary: str,
        status: str = "SUCCESS",
        metadata: Optional[Dict[str, Any]] = None
    ) -> ComprehensiveAuditEvent:
        ev = ComprehensiveAuditEvent(
            component=component,
            event_type=event_type,
            event_id=event_id,
            title=title,
            summary=summary,
            status=status,
            metadata=metadata or {}
        )
        self._events.insert(0, ev)
        return ev

    def get_recent(self, limit: int = 50, component: Optional[str] = None) -> List[ComprehensiveAuditEvent]:
        if component:
            return [e for e in self._events if e.component == component][:limit]
        return self._events[:limit]

    def clear(self):
        self._events.clear()


# Global singleton
audit_logger = GovernanceAuditLogger()
