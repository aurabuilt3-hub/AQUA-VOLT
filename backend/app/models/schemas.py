from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, field_validator, model_validator

class EnergyState(BaseModel):
    solar_kw: float
    solar_drop_percent: float = 0.0
    grid_available: bool = True
    total_load_kw: float
    diesel_gen_running: bool = False

class BatteryState(BaseModel):
    battery_soc: float
    battery_voltage: float = 48.0
    battery_health_pct: float = 95.0

class PondState(BaseModel):
    pond_do: float
    pond_do_trend: Literal["falling", "stable", "rising"] = "stable"
    pond_water_temp: float
    aerators_on: int
    total_aerators: int = 4

class ColdChainState(BaseModel):
    cold_room_temp: float
    cold_room_target_min: float = 2.0
    cold_room_target_max: float = 5.0
    thermal_precooling_active: bool = False
    thermal_buffer_hours: float = 2.5

class EquipmentState(BaseModel):
    pumps_kw: float = 2.1
    ice_plant_kw: float = 3.0
    processing_kw: float = 4.0
    lighting_kw: float = 0.8
    aerator_soft_start_active: bool = True
    inrush_surge_kw: float = 0.0

class IoTTelemetry(BaseModel):
    solar_gen_kw: float = Field(..., description="Solar generation in kW")
    battery_soc_pct: float = Field(..., description="Battery state of charge in %")
    grid_available: bool = Field(True, description="Grid power status")
    diesel_gen_running: bool = Field(False, description="Backup diesel generator status")
    pond_dissolved_oxygen_mg_l: float = Field(..., description="Dissolved Oxygen level in mg/L")
    pond_water_temp_c: float = Field(..., description="Pond water temperature in Celsius")
    aerators_total: int = Field(4, description="Total installed aerators")
    aerators_running: int = Field(4, description="Currently running aerators")
    aerator_soft_start_active: bool = Field(False, description="Aerator soft-start rig status")
    inrush_surge_kw: float = Field(0.0, description="Measured peak inrush surge power in kW")
    cold_room_temp_c: float = Field(..., description="Cold storage temperature in Celsius")
    cold_room_target_temp_c: float = Field(4.0, description="Target cold room temperature")
    thermal_precooling_active: bool = Field(False, description="Thermal pre-cooling status")
    thermal_buffer_hours: float = Field(2.5, description="Estimated thermal storage buffer in hours")
    pumps_kw: float = Field(2.1, description="Water circulation pumps load in kW")
    ice_plant_kw: float = Field(3.0, description="Ice production plant load in kW")
    processing_plant_kw: float = Field(4.0, description="Shrimp processing load in kW")
    lighting_kw: float = Field(0.8, description="Lighting and auxiliary load in kW")

class IoTEvent(BaseModel):
    id: str
    name: str
    category: str
    severity: Literal["high", "med", "low"]
    icon: str
    description: str
    timestamp: str
    energy_state: EnergyState
    battery_state: BatteryState
    pond_state: PondState
    cold_chain_state: ColdChainState
    equipment_state: EquipmentState
    relevant_measurements: Dict[str, Any]
    telemetry: IoTTelemetry

    @property
    def title(self) -> str:
        return self.name

class FarmState(BaseModel):
    active_event_id: str
    active_event_name: str
    timestamp: str
    energy_state: EnergyState
    battery_state: BatteryState
    pond_state: PondState
    cold_chain_state: ColdChainState
    equipment_state: EquipmentState
    relevant_measurements: Dict[str, Any]
    telemetry: IoTTelemetry

# Normalized AquaVolt Shared State (Phase 7)
class NormalizedAquaVoltState(BaseModel):
    timestamp: str
    solar_kw: float
    battery_soc: float
    grid_available: bool
    pond_do: float
    pond_temperature: float
    cold_room_temperature: float
    cold_room_target: float
    aerator_status: str = "running"
    cooling_status: str = "running"
    ice_plant_status: str = "running"
    processing_status: str = "running"
    inrush_surge_kw: float = 0.0
    total_load_kw: float = 0.0

# Structured Specialist Agent Models (Phase 8)
class PondAgentOutput(BaseModel):
    pond_status: Literal["ok", "warning", "critical"]
    aeration_criticality: Literal["low", "medium", "high", "emergency"]
    recommended_aeration: str
    warnings: List[str]
    explanation: str
    key_metrics: Dict[str, str]
    # AgentShield & PS04 normalized output fields
    risk: str = "low"
    observations: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    confidence: float = 0.95
    reasoning_summary: str = ""

class EnergyAgentOutput(BaseModel):
    energy_status: Literal["ok", "warning", "critical"]
    available_energy: float
    energy_deficit: float
    battery_action: str
    grid_action: str
    warnings: List[str]
    key_metrics: Dict[str, str]
    # AgentShield & PS04 normalized output fields
    battery_risk: str = "low"
    recommendations: List[str] = Field(default_factory=list)

class ColdChainAgentOutput(BaseModel):
    cold_chain_status: Literal["ok", "warning", "critical"]
    refrigeration_priority: Literal["low", "medium", "high", "critical"]
    pre_cooling_recommendation: str
    temperature_risk: Literal["low", "moderate", "high"]
    explanation: str
    warnings: List[str] = Field(default_factory=list)
    key_metrics: Dict[str, str]
    # AgentShield & PS04 normalized output fields
    cooling_risk: str = "low"
    thermal_buffer: str = "2.5 Hours"
    recommendations: List[str] = Field(default_factory=list)

class RiskAgentOutput(BaseModel):
    overall_risk: Literal["low", "medium", "high", "critical"]
    overall_risk_score: int = Field(..., ge=0, le=100)
    critical_loads: List[str]
    high_priority_loads: List[str]
    flexible_loads: List[str]
    loads_must_never_be_disabled: List[str]
    human_approval_requirement: bool
    explanation: str
    key_metrics: Dict[str, str]

class CoordinatedActionPlan(BaseModel):
    event_id: str
    event_name: str
    critical_loads: List[str]
    keep_running: List[str]
    defer: List[str]
    reduce: List[str]
    battery_action: str
    battery_reserve_percent: float = 20.0
    grid_strategy: str
    thermal_action: str
    aerator_action: str
    requires_human_approval: bool
    explanation: str
    ai_used: bool = False
    ai_fallback_reason: Optional[str] = None

class SafetyEngineResult(BaseModel):
    approved: bool
    blocked_actions: List[str]
    modified_actions: List[str]
    warnings: List[str]
    requires_human_approval: bool
    reason: str

# Tool Gateway & Digital Twin Models (Phases 14, 15)
class ToolCallRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    event_id: Optional[str] = None
    authorized_by: str = "AquaVolt Governance Engine"
    human_approved: bool = False

class ToolExecutionResult(BaseModel):
    status: Literal["SUCCESS", "BLOCKED", "ERROR"]
    tool_name: str
    parameters: Dict[str, Any]
    authorized_by: str
    human_approved: bool
    message: str
    twin_state_after: Optional[Dict[str, Any]] = None
    error_detail: Optional[str] = None

# Impact & Comparison Models
class ScenarioComparison(BaseModel):
    metric_name: str
    without_aquavolt: str
    with_aquavolt: str
    difference_savings: str

class DetailedImpactMetrics(BaseModel):
    energy_before_kw: float
    energy_after_kw: float
    loads_deferred_kw: float
    energy_optimized_kwh: float
    cost_avoided_inr: float
    diesel_avoided_liters: float
    co2_avoided_kg: float
    critical_operation_uptime_pct: float = 100.0
    product_protected_tons: float
    battery_reserve_maintained_pct: float
    cold_chain_protection_hours: float
    peak_demand_reduction_kw: float
    comparison_table: List[ScenarioComparison]
    disclaimer: str = "Simulated PoC estimates calculated from microgrid load parameters, local tariffs (₹9.50/kWh), and diesel generator specs (0.25 L/kWh)."

# Simulator & Timeline Models
class ControlActionLog(BaseModel):
    action: str
    target_equipment: str
    previous_state: str
    new_state: str
    timestamp: str
    success: bool = True
    message: str

class TimelineStep(BaseModel):
    step_number: int
    timestamp: str
    title: str
    detail: str
    status: Literal["completed", "active", "pending"]

class ImpactMetrics(BaseModel):
    energy_optimized_kwh: float
    cost_avoided_inr: float
    diesel_avoided_liters: float
    co2_avoided_kg: float
    product_protected_tons: float
    critical_ops_safety_pct: float
    aerator_inrush_suppressed_kw: float
    thermal_energy_stored_kwh: float
    timestamp: str

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    event_id: str
    event_title: str
    detected_risk: str = "Risk Score HIGH — Mandatory Operator Approval Required"
    agent_analysis: str = "Pond DO safe; Solar dropped 60%; Battery 38%; Cold room safe at 4.3°C."
    recommended_action: str = "Protect aeration (Simulated VFD Soft-Start) + cold storage; Defer ice plant & processing."
    safety_result: str = "Passed (9 Safety Policies Verified)"
    human_decision: str = "APPROVED"
    execution_result: str = "[PoC Simulated] Commands dispatched to PoC Digital Control Layer (Digital Twin / Simulated Control)."
    action_taken: str
    executed_by: str = "Demo Operator"
    summary: str
    impact: ImpactMetrics

class ExecutionSimulationResult(BaseModel):
    event_id: str
    action_taken: str
    is_simulation: bool = True
    executed_at: str
    control_actions: List[ControlActionLog]
    timeline: List[TimelineStep]
    summary_message: str
    impact: ImpactMetrics
    audit_entry: AuditLogEntry

class AgentAnalysis(BaseModel):
    agent_id: str
    agent_name: str
    icon: str
    status: Literal["ok", "warning", "critical"]
    findings: List[str]
    key_metrics: Dict[str, str]

class ActionPlanItem(BaseModel):
    id: str
    category: Literal["keep", "defer", "strategy", "soft_start", "precool"]
    title: str
    description: str
    power_kw: float
    status: str
    tag: str

class SoftStartRigState(BaseModel):
    enabled: bool
    ramp_duration_sec: int = 120
    stagger_interval_sec: int = 30
    peak_inrush_prevented_kw: float
    motor_wear_reduction_pct: float
    current_step: str

class ThermalPrecoolRigState(BaseModel):
    enabled: bool
    cold_storage_precooled_temp_c: float = 1.5
    thermal_energy_stored_kwh: float
    compressor_safe_off_duration_hours: float
    solar_surplus_utilized_kw: float
    status: str

class SafetyIntervention(BaseModel):
    """
    A single Safety Engine intervention — one blocked/repaired action.
    Structured so the frontend can render a human-readable card per policy.
    """
    policy_id: str                    # e.g. "POLICY_5"
    policy_name: str                  # e.g. "Aerator Soft-Start & Inrush Constraint"
    original_action: str              # What the Orchestrator originally proposed
    risk_reason: str                  # Plain-English risk explanation for the operator
    blocked_action: str               # Technical label of what was blocked
    safe_replacement: str             # Plain-English description of what AquaVolt did instead
    safe_replacement_detail: str      # Technical detail (e.g. "0 → 50 Hz / 120s ramp / 30s stagger")
    requires_human_approval: bool
    protection_message: str           # Friendly headline: "AquaVolt protected the operation."

# Policy Evaluation Response (Phase 12)
class PolicyEvaluationResponse(BaseModel):
    allowed: bool
    requires_human_approval: bool
    violations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    interventions: List[SafetyIntervention] = Field(default_factory=list)
    reason: str = ""

class ActionPlan(BaseModel):
    event_id: str
    event_title: str
    orchestrator_summary: str
    agent_analyses: List[AgentAnalysis]
    keep_running: List[ActionPlanItem]
    defer_or_reduce: List[ActionPlanItem]
    energy_strategy: List[ActionPlanItem]
    soft_start_rig: SoftStartRigState
    thermal_precool_rig: ThermalPrecoolRigState
    requires_human_approval: bool
    risk_score: int
    ai_used: bool = False
    ai_fallback_reason: Optional[str] = None
    safety_interventions: List[SafetyIntervention] = Field(
        default_factory=list,
        description="Structured list of Safety Engine blocks/repairs for UI display"
    )

class SafetyCheckResult(BaseModel):
    check_name: str
    passed: bool
    details: str

class SafetyValidation(BaseModel):
    is_safe: bool
    risk_level: str
    checks: List[SafetyCheckResult]
    warnings: List[str]

class ApprovalRequest(BaseModel):
    event_id: str
    action: Literal["approve", "modify", "reject"]
    plan_id: Optional[str] = None
    operator: Optional[str] = "Demo Operator"
    modified_items: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

    @field_validator("action", mode="before")
    @classmethod
    def normalize_action(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v

class CopilotQuery(BaseModel):
    question: str
    context_event_id: Optional[str] = None

class CopilotResponse(BaseModel):
    answer: str
    recommended_action: Optional[str] = None
    reasoning_steps: List[str]
    source: str = "AquaVolt Deterministic Rules & Domain Knowledge Base"

# ── Unified Operational Analysis API (POST /api/analyze) ──────────────────────
class AnalyzeRequest(BaseModel):
    input: Optional[str] = Field(None, description="Natural language telemetry or event description")
    input_text: Optional[str] = Field(None, description="Alias for input")
    event_type: Optional[str] = Field(None, description="Preset canonical event ID, e.g. SOLAR_DROP_60")
    telemetry: Optional[Dict[str, Any]] = Field(None, description="Structured telemetry measurements dict")

    @model_validator(mode="before")
    @classmethod
    def check_input_alias(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "input_text" in data and not data.get("input"):
                data["input"] = data["input_text"]
        return data

class RiskAssessment(BaseModel):
    level: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW", "NORMAL"
    score: int  # 0 - 100
    reasons: List[str]

class AgentDetail(BaseModel):
    agent_id: str
    agent_name: str
    icon: str
    status: str
    findings: List[str]
    key_metrics: Dict[str, str]

class AgentGroup(BaseModel):
    pond: AgentDetail
    energy: AgentDetail
    cold_chain: AgentDetail
    risk: AgentDetail

class OrchestrationDetail(BaseModel):
    priority_order: List[str]
    reasoning_summary: str

class PlanDetail(BaseModel):
    protect: List[ActionPlanItem]
    defer: List[ActionPlanItem]
    energy_strategy: List[ActionPlanItem]

class SafetyDetail(BaseModel):
    policies_checked: int = 9
    policies_passed: int = 9
    violations: List[str] = Field(default_factory=list)
    approval_required: bool
    interventions: List[SafetyIntervention] = Field(default_factory=list)

class DecisionDetail(BaseModel):
    status: str  # "PENDING", "AUTO_SAFE", "APPROVED", "MODIFIED", "REJECTED"

class UnifiedAnalysisResponse(BaseModel):
    analysis_id: str
    timestamp: str
    event_id: str
    event_title: str
    raw_input: str
    situation: str
    risk: RiskAssessment
    agents: AgentGroup
    orchestration: OrchestrationDetail
    plan: PlanDetail
    safety: SafetyDetail
    decision: DecisionDetail
    soft_start_rig: Optional[SoftStartRigState] = None
    thermal_precool_rig: Optional[ThermalPrecoolRigState] = None
    ai_used: bool = False
    ai_fallback_reason: Optional[str] = None

