export interface EnergyState {
  solar_kw: number;
  solar_drop_percent: number;
  grid_available: boolean;
  total_load_kw: number;
  diesel_gen_running?: boolean;
}

export interface BatteryState {
  battery_soc: number;
  battery_voltage?: number;
  battery_health_pct?: number;
}

export interface PondState {
  pond_do: number;
  pond_do_trend: 'falling' | 'stable' | 'rising';
  pond_water_temp: number;
  aerators_on: number;
  total_aerators: number;
}

export interface ColdChainState {
  cold_room_temp: number;
  cold_room_target_min: number;
  cold_room_target_max: number;
  thermal_precooling_active: boolean;
  thermal_buffer_hours: number;
}

export interface EquipmentState {
  pumps_kw: number;
  ice_plant_kw: number;
  processing_kw: number;
  lighting_kw: number;
  aerator_soft_start_active: boolean;
  inrush_surge_kw: number;
}

export interface IoTTelemetry {
  solar_gen_kw: number;
  battery_soc_pct: number;
  grid_available: boolean;
  diesel_gen_running: boolean;
  pond_dissolved_oxygen_mg_l: number;
  pond_water_temp_c: number;
  aerators_total: number;
  aerators_running: number;
  aerator_soft_start_active: boolean;
  inrush_surge_kw: number;
  cold_room_temp_c: number;
  cold_room_target_temp_c: number;
  thermal_precooling_active: boolean;
  thermal_buffer_hours: number;
  pumps_kw: number;
  ice_plant_kw: number;
  processing_plant_kw: number;
  lighting_kw: number;
}

export interface IoTEvent {
  id: string;
  name: string;
  category: string;
  severity: 'high' | 'med' | 'low';
  icon: string;
  description: string;
  timestamp: string;
  energy_state: EnergyState;
  battery_state: BatteryState;
  pond_state: PondState;
  cold_chain_state: ColdChainState;
  equipment_state: EquipmentState;
  relevant_measurements: Record<string, any>;
  telemetry: IoTTelemetry;
}

export interface FarmState {
  active_event_id: string;
  active_event_name: string;
  timestamp: string;
  energy_state: EnergyState;
  battery_state: BatteryState;
  pond_state: PondState;
  cold_chain_state: ColdChainState;
  equipment_state: EquipmentState;
  relevant_measurements: Record<string, any>;
  telemetry: IoTTelemetry;
}

export interface AgentAnalysis {
  agent_id: 'pond' | 'energy' | 'cold_chain' | 'risk';
  agent_name: string;
  icon: string;
  status: 'ok' | 'warning' | 'critical';
  findings: string[];
  key_metrics: Record<string, string>;
}

export interface ActionPlanItem {
  id: string;
  category: 'keep' | 'defer' | 'strategy' | 'soft_start' | 'precool';
  title: string;
  description: string;
  power_kw: number;
  status: string;
  tag: string;
}

export interface SoftStartRigState {
  enabled: boolean;
  ramp_duration_sec: number;
  stagger_interval_sec: number;
  peak_inrush_prevented_kw: number;
  motor_wear_reduction_pct: number;
  current_step: string;
}

export interface ThermalPrecoolRigState {
  enabled: boolean;
  cold_storage_precooled_temp_c: number;
  thermal_energy_stored_kwh: number;
  compressor_safe_off_duration_hours: number;
  solar_surplus_utilized_kw: number;
  status: string;
}

export interface SafetyIntervention {
  policy_id: string;           // e.g. "POLICY_5"
  policy_name: string;         // e.g. "Aerator Soft-Start & Inrush Constraint"
  original_action: string;     // What was originally proposed
  risk_reason: string;         // Plain-English risk explanation
  blocked_action: string;      // Technical label of what was blocked
  safe_replacement: string;    // Plain-English safe replacement description
  safe_replacement_detail: string; // Technical detail string
  requires_human_approval: boolean;
  protection_message: string;  // Friendly headline
}

export interface ActionPlan {
  event_id: string;
  event_title: string;
  orchestrator_summary: string;
  agent_analyses: AgentAnalysis[];
  keep_running: ActionPlanItem[];
  defer_or_reduce: ActionPlanItem[];
  energy_strategy: ActionPlanItem[];
  soft_start_rig: SoftStartRigState;
  thermal_precool_rig: ThermalPrecoolRigState;
  requires_human_approval: boolean;
  risk_score: number;
  ai_used?: boolean;
  ai_fallback_reason?: string;
  safety_interventions?: SafetyIntervention[];
}

export interface ImpactMetrics {
  energy_optimized_kwh: number;
  cost_avoided_inr: number;
  diesel_avoided_liters: number;
  co2_avoided_kg: number;
  product_protected_tons: number;
  critical_ops_safety_pct: number;
  aerator_inrush_suppressed_kw: number;
  thermal_energy_stored_kwh: number;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event_id: string;
  event_title: string;
  detected_risk?: string;
  agent_analysis?: string;
  recommended_action?: string;
  safety_result?: string;
  human_decision?: string;
  execution_result?: string;
  action_taken: string;
  executed_by: string;
  summary: string;
  impact: ImpactMetrics;
}

export interface ApprovalRequest {
  event_id: string;
  action: 'approve' | 'modify' | 'reject';
  notes?: string;
}

export interface ExecutionResult {
  status: string;
  message: string;
  audit_entry: AuditLogEntry;
  impact: ImpactMetrics;
  simulation?: any;
}

export interface CopilotQuery {
  question: string;
  context_event_id?: string;
}

export interface CopilotResponse {
  answer: string;
  recommended_action?: string;
  reasoning_steps: string[];
  source: string;
}

export interface CoordinatedActionPlan {
  event_id: string;
  event_name: string;
  critical_loads: string[];
  keep_running: string[];
  defer: string[];
  reduce: string[];
  battery_action: string;
  battery_reserve_percent: number;
  grid_strategy: string;
  thermal_action: string;
  aerator_action: string;
  requires_human_approval: boolean;
  explanation: string;
  ai_used?: boolean;
  ai_fallback_reason?: string;
}

export interface AIHealthStatus {
  ai_configured: boolean;
  ai_enabled: boolean;
  model: string;
  request_count: number;
  cache_hits: number;
  cache_misses: number;
  fallback_count: number;
  latency_avg_ms: number;
  cache_size: number;
}

export interface AnalyzeRequestPayload {
  input?: string;
  event_type?: string;
  telemetry?: Record<string, any>;
}

export interface RiskAssessmentData {
  level: string;
  score: number;
  reasons: string[];
}

export interface AgentDetailData {
  agent_id: string;
  agent_name: string;
  icon: string;
  status: string;
  findings: string[];
  key_metrics: Record<string, string>;
}

export interface AgentGroupData {
  pond: AgentDetailData;
  energy: AgentDetailData;
  cold_chain: AgentDetailData;
  risk: AgentDetailData;
}

export interface OrchestrationDetailData {
  priority_order: string[];
  reasoning_summary: string;
}

export interface PlanDetailData {
  protect: ActionPlanItem[];
  defer: ActionPlanItem[];
  energy_strategy: ActionPlanItem[];
}

export interface SafetyDetailData {
  policies_checked: number;
  policies_passed: number;
  violations: string[];
  approval_required: boolean;
  interventions: SafetyIntervention[];
}

export interface DecisionDetailData {
  status: string;
}

export interface UnifiedAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  event_id: string;
  event_title: string;
  raw_input: string;
  situation: string;
  risk: RiskAssessmentData;
  agents: AgentGroupData;
  orchestration: OrchestrationDetailData;
  plan: PlanDetailData;
  safety: SafetyDetailData;
  decision: DecisionDetailData;
  soft_start_rig?: SoftStartRigState;
  thermal_precool_rig?: ThermalPrecoolRigState;
  ai_used?: boolean;
  ai_fallback_reason?: string;
}

