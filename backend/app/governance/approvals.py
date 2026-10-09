"""AquaVolt Human-in-the-Loop Approval Workflow (Phase 13, adapted from AgentShield).

Manages approval requests, status transitions (PENDING, APPROVED, MODIFIED, REJECTED),
and records human decisions with complete provenance.
"""

from typing import Dict, Any, List, Optional
import time
import datetime
import uuid
from pydantic import BaseModel, Field


class ApprovalWorkflowRequest(BaseModel):
    id: str = Field(default_factory=lambda: f"appr_{uuid.uuid4().hex[:8]}")
    event_id: str
    event_title: str
    proposed_plan: Dict[str, Any]
    agent_outputs: Dict[str, Any]
    reasoning_summary: str
    safety_result: Dict[str, Any]
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    risk_score: int
    status: str = "PENDING"  # "PENDING", "APPROVED", "MODIFIED", "REJECTED"
    created_at: str = Field(default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    reviewed_at: Optional[str] = None
    reviewer: str = "Demo Operator"
    operator_notes: Optional[str] = None
    executed_action: Optional[str] = None


class GovernanceApprovalEngine:
    def __init__(self):
        self._requests: Dict[str, ApprovalWorkflowRequest] = {}

    def create_request(
        self,
        event_id: str,
        event_title: str,
        proposed_plan: Dict[str, Any],
        agent_outputs: Dict[str, Any],
        reasoning_summary: str,
        safety_result: Dict[str, Any],
        risk_level: str,
        risk_score: int
    ) -> ApprovalWorkflowRequest:
        req = ApprovalWorkflowRequest(
            event_id=event_id,
            event_title=event_title,
            proposed_plan=proposed_plan,
            agent_outputs=agent_outputs,
            reasoning_summary=reasoning_summary,
            safety_result=safety_result,
            risk_level=risk_level,
            risk_score=risk_score
        )
        self._requests[req.id] = req
        return req

    def get_request(self, approval_id: str) -> Optional[ApprovalWorkflowRequest]:
        return self._requests.get(approval_id)

    def get_by_event(self, event_id: str) -> Optional[ApprovalWorkflowRequest]:
        for r in reversed(list(self._requests.values())):
            if r.event_id == event_id:
                return r
        return None

    def process_decision(
        self,
        event_id: str,
        action: str,  # "approve", "modify", "reject"
        reviewer: str = "Demo Operator",
        notes: Optional[str] = None
    ) -> ApprovalWorkflowRequest:
        req = self.get_by_event(event_id)
        if not req:
            req = ApprovalWorkflowRequest(
                event_id=event_id,
                event_title=event_id,
                proposed_plan={},
                agent_outputs={},
                reasoning_summary="",
                safety_result={},
                risk_level="HIGH",
                risk_score=50
            )
            self._requests[req.id] = req

        act = action.lower()
        if act == "approve":
            req.status = "APPROVED"
        elif act == "reject":
            req.status = "REJECTED"
        elif act == "modify":
            req.status = "MODIFIED"
        else:
            req.status = action.upper()

        req.reviewed_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        req.reviewer = reviewer
        req.operator_notes = notes
        req.executed_action = req.status
        return req

    def clear(self):
        self._requests.clear()


# Global singleton
approval_engine = GovernanceApprovalEngine()
