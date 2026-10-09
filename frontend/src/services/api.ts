import { IoTEvent, ActionPlan, ApprovalRequest, ExecutionResult, AuditLogEntry, CopilotQuery, CopilotResponse, FarmState, CoordinatedActionPlan, AIHealthStatus, AnalyzeRequestPayload, UnifiedAnalysisResponse } from '../types';

function getApiBase(): string {
  // 1. Check if an explicit backend URL is provided via Vite environment variables
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const envUrl = (
    metaEnv?.VITE_API_URL ||
    metaEnv?.VITE_BACKEND_URL ||
    ''
  ).trim();

  if (envUrl) {
    // Strip trailing slashes
    const cleanUrl = envUrl.replace(/\/+$/, '');
    // Ensure /api suffix is present without duplication
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  // 2. In production builds (e.g. deployed on Vercel), default to the deployed backend
  if (metaEnv?.PROD) {
    return 'https://aqua-volt-rouge.vercel.app/api';
  }

  // 3. In local development, use relative '/api' which Vite proxies to localhost:8000
  return '/api';
}

export const API_BASE = getApiBase();

export async function analyzeOperationalInput(payload: AnalyzeRequestPayload): Promise<UnifiedAnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Operational analysis failed (${res.status}): ${errorText || res.statusText}`);
  }
  return await res.json();
}

export async function checkBackendHealth(): Promise<{ status: string; service?: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAIHealth(): Promise<AIHealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/ai/health`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return {
      ai_configured: false,
      ai_enabled: false,
      model: "gemini-2.5-flash",
      request_count: 0,
      cache_hits: 0,
      cache_misses: 0,
      fallback_count: 0,
      latency_avg_ms: 0.0,
      cache_size: 0
    };
  }
}

export async function fetchCoordinatedPlan(eventId: string): Promise<CoordinatedActionPlan> {
  try {
    const res = await fetch(`${API_BASE}/orchestrator/coordinated-plan/${eventId}`, { method: 'POST' });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, using fallback coordinated plan:', err);
    return {
      event_id: eventId,
      event_name: eventId,
      critical_loads: ["aeration", "cold_storage"],
      keep_running: ["aerators", "refrigeration", "water_pumps"],
      defer: ["ice_production", "processing"],
      reduce: ["non_essential_lighting"],
      battery_action: "discharge",
      battery_reserve_percent: 20.0,
      grid_strategy: "standby",
      thermal_action: "use_existing_cold_buffer",
      aerator_action: "soft_start_with_energy_check",
      requires_human_approval: true,
      explanation: "Deterministic Safe Optimization Mode: Priority given to life-critical aeration with VFD soft-start.",
      ai_used: false,
      ai_fallback_reason: "API connection offline (Offline fallback)"
    };
  }
}

export async function fetchEvents(): Promise<IoTEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, using fallback event data:', err);
    return FALLBACK_EVENTS;
  }
}

export async function activateEvent(eventId: string): Promise<FarmState> {
  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/activate`, { method: 'POST' });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, returning fallback farm state:', err);
    const ev = FALLBACK_EVENTS.find(e => e.id === eventId) || FALLBACK_EVENTS[0];
    return {
      active_event_id: ev.id,
      active_event_name: ev.name,
      timestamp: new Date().toISOString(),
      energy_state: ev.energy_state,
      battery_state: ev.battery_state,
      pond_state: ev.pond_state,
      cold_chain_state: ev.cold_chain_state,
      equipment_state: ev.equipment_state,
      relevant_measurements: ev.relevant_measurements,
      telemetry: ev.telemetry
    };
  }
}

export async function generatePlan(eventId: string): Promise<ActionPlan> {
  try {
    const res = await fetch(`${API_BASE}/plan/${eventId}`, { method: 'POST' });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    console.warn('Backend API unreachable, generating fallback plan:', err);
    return generateFallbackPlan(eventId);
  }
}

export async function postApproval(request: ApprovalRequest): Promise<ExecutionResult> {
  const res = await fetch(`${API_BASE}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Approval execution failed (${res.status}): ${errorText || res.statusText}`);
  }
  return await res.json();
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return FALLBACK_AUDIT_LOGS;
  }
}

export async function askCopilot(query: CopilotQuery): Promise<CopilotResponse> {
  const res = await fetch(`${API_BASE}/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Copilot query failed (${res.status}): ${errorText || res.statusText}`);
  }
  return await res.json();
}

export async function fetchDigitalTwinState(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/digital-twin/state`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchTools(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/tools`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function executeTool(toolName: string, parameters: Record<string, any> = {}, eventId?: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: toolName,
        parameters,
        event_id: eventId,
        human_approved: true
      })
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchGovernanceAuditTrail(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/governance/audit-trail`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (err) {
    return [];
  }
}

// Fallback structured 10 events
const FALLBACK_EVENTS: IoTEvent[] = [
  {
    id: "SOLAR_DROP_60",
    name: "Solar generation dropped 60%",
    category: "solar",
    severity: "high",
    icon: "☀️",
    description: "Sudden cloud cover reduced solar output from 18.4 kW to 4.1 kW (60% drop). Load deficit detected.",
    timestamp: "2026-10-02T13:00:00Z",
    energy_state: { solar_kw: 4.1, solar_drop_percent: 60, grid_available: true, total_load_kw: 18.3 },
    battery_state: { battery_soc: 38, battery_voltage: 48.0, battery_health_pct: 95 },
    pond_state: { pond_do: 4.2, pond_do_trend: "falling", pond_water_temp: 28.1, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 4.3, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 2.5 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { solar_kw: 4.1, solar_drop_percent: 60, battery_soc: 38, pond_do: 4.2, cold_room_temp: 4.3, total_load_kw: 18.3, grid_available: true },
    telemetry: {
      solar_gen_kw: 4.1, battery_soc_pct: 38, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 4.2, pond_water_temp_c: 28.1, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 4.3, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 2.5, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "BATTERY_LOW_20",
    name: "Battery below 20%",
    category: "battery",
    severity: "high",
    icon: "🔋",
    description: "Battery SOC dropped to critical 18% reserve floor. Load shedding mandatory.",
    timestamp: "2026-10-02T13:05:00Z",
    energy_state: { solar_kw: 10.1, solar_drop_percent: 15, grid_available: false, total_load_kw: 16.3 },
    battery_state: { battery_soc: 18, battery_voltage: 45.2, battery_health_pct: 92 },
    pond_state: { pond_do: 4.6, pond_do_trend: "stable", pond_water_temp: 28.0, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 4.1, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 2.0 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { solar_kw: 10.1, battery_soc: 18, grid_available: false, pond_do: 4.6, cold_room_temp: 4.1, total_load_kw: 16.3 },
    telemetry: {
      solar_gen_kw: 10.1, battery_soc_pct: 18, grid_available: false, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 4.6, pond_water_temp_c: 28.0, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 4.1, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 2.0, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "POND_DO_FALLING",
    name: "Pond dissolved oxygen falling",
    category: "oxygen",
    severity: "high",
    icon: "🐟",
    description: "Dissolved oxygen in Pond #2 dropped to 2.9 mg/L. Emergency aerator soft-start boost required.",
    timestamp: "2026-10-02T13:10:00Z",
    energy_state: { solar_kw: 12.2, solar_drop_percent: 0, grid_available: true, total_load_kw: 15.5 },
    battery_state: { battery_soc: 52, battery_voltage: 48.5, battery_health_pct: 96 },
    pond_state: { pond_do: 2.9, pond_do_trend: "falling", pond_water_temp: 29.4, aerators_on: 2, total_aerators: 6 },
    cold_chain_state: { cold_room_temp: 4.1, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 3.0 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 18.5 },
    relevant_measurements: { pond_do: 2.9, pond_do_trend: "falling", aerators_on: 2, total_aerators: 6, pond_water_temp: 29.4 },
    telemetry: {
      solar_gen_kw: 12.2, battery_soc_pct: 52, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 2.9, pond_water_temp_c: 29.4, aerators_total: 6, aerators_running: 2,
      aerator_soft_start_active: true, inrush_surge_kw: 18.5, cold_room_temp_c: 4.1, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 3.0, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "COLD_ROOM_TEMP_RISING",
    name: "Cold room temperature rising",
    category: "cold",
    severity: "high",
    icon: "❄️",
    description: "Cold room temperature rose to 6.2°C, exceeding 5.0°C safety threshold. Thermal pre-cooling boost needed.",
    timestamp: "2026-10-02T13:15:00Z",
    energy_state: { solar_kw: 11.5, solar_drop_percent: 10, grid_available: true, total_load_kw: 16.8 },
    battery_state: { battery_soc: 48, battery_voltage: 47.8, battery_health_pct: 94 },
    pond_state: { pond_do: 4.8, pond_do_trend: "stable", pond_water_temp: 28.2, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 6.2, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: true, thermal_buffer_hours: 1.2 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { cold_room_temp: 6.2, target_max: 5.0, thermal_buffer_hours: 1.2 },
    telemetry: {
      solar_gen_kw: 11.5, battery_soc_pct: 48, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 4.8, pond_water_temp_c: 28.2, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 6.2, cold_room_target_temp_c: 2.0,
      thermal_precooling_active: true, thermal_buffer_hours: 1.2, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "GRID_FAILURE",
    name: "Grid failure detected",
    category: "grid",
    severity: "high",
    icon: "⚡",
    description: "Main electrical grid power lost. Microgrid switching to solar + battery island mode.",
    timestamp: "2026-10-02T13:20:00Z",
    energy_state: { solar_kw: 9.2, solar_drop_percent: 20, grid_available: false, total_load_kw: 14.2 },
    battery_state: { battery_soc: 62, battery_voltage: 49.0, battery_health_pct: 96 },
    pond_state: { pond_do: 4.4, pond_do_trend: "stable", pond_water_temp: 28.0, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 4.2, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 3.5 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { grid_available: false, solar_kw: 9.2, battery_soc: 62 },
    telemetry: {
      solar_gen_kw: 9.2, battery_soc_pct: 62, grid_available: false, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 4.4, pond_water_temp_c: 28.0, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 4.2, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 3.5, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "POND_TEMP_HIGH",
    name: "Pond temperature above threshold",
    category: "temp",
    severity: "med",
    icon: "🌡️",
    description: "Pond water temperature reached 30.5°C (Threshold: 29.5°C). High temperature reduces oxygen solubility.",
    timestamp: "2026-10-02T13:25:00Z",
    energy_state: { solar_kw: 13.1, solar_drop_percent: 0, grid_available: true, total_load_kw: 16.0 },
    battery_state: { battery_soc: 56, battery_voltage: 48.2, battery_health_pct: 95 },
    pond_state: { pond_do: 4.7, pond_do_trend: "falling", pond_water_temp: 30.5, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 4.2, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 3.0 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { pond_water_temp: 30.5, threshold_temp: 29.5, pond_do: 4.7 },
    telemetry: {
      solar_gen_kw: 13.1, battery_soc_pct: 56, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 4.7, pond_water_temp_c: 30.5, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 4.2, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 3.0, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "AERATOR_START_REQUESTED",
    name: "Aerator start requested",
    category: "aerator",
    severity: "med",
    icon: "🌀",
    description: "Manual request to start 2 additional aerator motors. Direct startup would cause 16.2 kW inrush surge.",
    timestamp: "2026-10-02T13:30:00Z",
    energy_state: { solar_kw: 12.8, solar_drop_percent: 0, grid_available: true, total_load_kw: 15.2 },
    battery_state: { battery_soc: 54, battery_voltage: 48.0, battery_health_pct: 95 },
    pond_state: { pond_do: 3.8, pond_do_trend: "falling", pond_water_temp: 28.3, aerators_on: 3, total_aerators: 5 },
    cold_chain_state: { cold_room_temp: 4.2, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 2.8 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 16.2 },
    relevant_measurements: { requested_aerators: 2, potential_inrush_kw: 16.2, soft_start_rig_active: true },
    telemetry: {
      solar_gen_kw: 12.8, battery_soc_pct: 54, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 3.8, pond_water_temp_c: 28.3, aerators_total: 5, aerators_running: 3,
      aerator_soft_start_active: true, inrush_surge_kw: 16.2, cold_room_temp_c: 4.2, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 2.8, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "SOLAR_NORMAL",
    name: "Solar generation normal",
    category: "solar",
    severity: "low",
    icon: "☀️",
    description: "Optimal midday solar output at 18.4 kW. Ideal window for Thermal Pre-Cooling of Cold Storage.",
    timestamp: "2026-10-02T13:35:00Z",
    energy_state: { solar_kw: 18.4, solar_drop_percent: 0, grid_available: true, total_load_kw: 11.2 },
    battery_state: { battery_soc: 72, battery_voltage: 51.2, battery_health_pct: 98 },
    pond_state: { pond_do: 5.4, pond_do_trend: "rising", pond_water_temp: 28.1, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 4.1, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: true, thermal_buffer_hours: 4.5 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { solar_kw: 18.4, solar_surplus_kw: 7.2, thermal_precooling_active: true },
    telemetry: {
      solar_gen_kw: 18.4, battery_soc_pct: 72, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 5.4, pond_water_temp_c: 28.1, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 4.1, cold_room_target_temp_c: 1.5,
      thermal_precooling_active: true, thermal_buffer_hours: 4.5, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "BATTERY_HEALTHY",
    name: "Battery healthy",
    category: "battery",
    severity: "low",
    icon: "🔋",
    description: "Battery pack fully charged at 82% SOC with healthy cell voltages across all banks.",
    timestamp: "2026-10-02T13:40:00Z",
    energy_state: { solar_kw: 17.1, solar_drop_percent: 0, grid_available: true, total_load_kw: 12.0 },
    battery_state: { battery_soc: 82, battery_voltage: 52.0, battery_health_pct: 99 },
    pond_state: { pond_do: 5.2, pond_do_trend: "stable", pond_water_temp: 27.9, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 4.0, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 4.0 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { battery_soc: 82, battery_health_pct: 99, reserve_margin_pct: 62 },
    telemetry: {
      solar_gen_kw: 17.1, battery_soc_pct: 82, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 5.2, pond_water_temp_c: 27.9, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 4.0, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 4.0, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  },
  {
    id: "COLD_CHAIN_STABLE",
    name: "Cold chain stable",
    category: "cold",
    severity: "low",
    icon: "❄️",
    description: "Cold room temperature perfectly stabilized at 3.8°C with 2.8 tons of harvested shrimp product.",
    timestamp: "2026-10-02T13:45:00Z",
    energy_state: { solar_kw: 18.0, solar_drop_percent: 0, grid_available: true, total_load_kw: 11.5 },
    battery_state: { battery_soc: 76, battery_voltage: 50.8, battery_health_pct: 97 },
    pond_state: { pond_do: 5.5, pond_do_trend: "stable", pond_water_temp: 27.8, aerators_on: 4, total_aerators: 4 },
    cold_chain_state: { cold_room_temp: 3.8, cold_room_target_min: 2, cold_room_target_max: 5, thermal_precooling_active: false, thermal_buffer_hours: 3.8 },
    equipment_state: { pumps_kw: 2.1, ice_plant_kw: 3.0, processing_kw: 4.0, lighting_kw: 0.8, aerator_soft_start_active: true, inrush_surge_kw: 0 },
    relevant_measurements: { cold_room_temp: 3.8, product_tons: 2.8, thermal_buffer_hours: 3.8 },
    telemetry: {
      solar_gen_kw: 18.0, battery_soc_pct: 76, grid_available: true, diesel_gen_running: false,
      pond_dissolved_oxygen_mg_l: 5.5, pond_water_temp_c: 27.8, aerators_total: 4, aerators_running: 4,
      aerator_soft_start_active: true, inrush_surge_kw: 0, cold_room_temp_c: 3.8, cold_room_target_temp_c: 4.0,
      thermal_precooling_active: false, thermal_buffer_hours: 3.8, pumps_kw: 2.1, ice_plant_kw: 3.0,
      processing_plant_kw: 4.0, lighting_kw: 0.8
    }
  }
];

let FALLBACK_AUDIT_LOGS: AuditLogEntry[] = [];

function generateFallbackPlan(eventId: string): ActionPlan {
  const event = FALLBACK_EVENTS.find(e => e.id === eventId) || FALLBACK_EVENTS[0];
  const t = event.telemetry;

  return {
    event_id: event.id,
    event_title: event.name,
    orchestrator_summary: `AquaVolt Orchestrator analyzed telemetry event '${event.name}'. Critical loads (Pond aerators soft-start & Cold Storage) are prioritized. Non-essential loads are deferred to protect battery reserve.`,
    agent_analyses: [
      {
        agent_id: 'pond',
        agent_name: 'Pond Health & Aerator Specialist',
        icon: '🐟',
        status: t.pond_dissolved_oxygen_mg_l < 3.5 ? 'critical' : 'ok',
        findings: [
          `Dissolved Oxygen: ${t.pond_dissolved_oxygen_mg_l} mg/L (Safe: >= 4.0 mg/L)`,
          'VFD Soft-Start Rig active: Preventing 350% motor inrush surge on inverter.'
        ],
        key_metrics: { DO: `${t.pond_dissolved_oxygen_mg_l} mg/L`, Aerators: `${t.aerators_running}/${t.aerators_total} Active` }
      },
      {
        agent_id: 'energy',
        agent_name: 'Energy & Microgrid Specialist',
        icon: '⚡',
        status: t.battery_soc_pct < 20 ? 'critical' : 'ok',
        findings: [
          `Solar generation: ${t.solar_gen_kw} kW | Battery SOC: ${t.battery_soc_pct}%`,
          `Grid Power: ${t.grid_available ? 'Connected' : 'Unavailable'}`
        ],
        key_metrics: { Solar: `${t.solar_gen_kw} kW`, Battery: `${t.battery_soc_pct}%` }
      },
      {
        agent_id: 'cold_chain',
        agent_name: 'Cold Storage & Thermal Pre-Cooling Specialist',
        icon: '❄️',
        status: t.cold_room_temp_c > 5.0 ? 'warning' : 'ok',
        findings: [
          `Cold room temp: ${t.cold_room_temp_c}°C`,
          t.thermal_precooling_active ? 'Thermal Pre-Cooling active (1.5°C): Storing thermal energy buffer.' : 'Operating at standard 4.0°C.'
        ],
        key_metrics: { Temp: `${t.cold_room_temp_c}°C`, Buffer: `${t.thermal_buffer_hours} Hours` }
      },
      {
        agent_id: 'risk',
        agent_name: 'Operational & Safety Risk Specialist',
        icon: '🛡️',
        status: event.severity === 'high' ? 'critical' : 'ok',
        findings: [
          `Event Risk Score: ${event.severity === 'high' ? '83/100 (CRITICAL)' : event.severity === 'med' ? '57/100 (MEDIUM)' : '0/100 (NORMAL)'}`,
          'Critical load safety rules enforced.'
        ],
        key_metrics: { Risk: event.severity === 'high' ? '83/100' : event.severity === 'med' ? '57/100' : '0/100', HumanReview: event.severity === 'high' ? 'Required' : 'Auto' }
      }
    ],
    keep_running: [
      { id: 'aerators', category: 'keep', title: '🐟 Pond Aerators (Soft-Start Managed)', description: `Maintaining ${t.aerators_running} aerators with VFD Soft-Start Rig.`, power_kw: 6.4, status: 'active', tag: 'CRITICAL — Soft Start Active' },
      { id: 'cold_storage', category: 'keep', title: '❄️ Cold Storage Refrigeration', description: 'Maintaining product temperature safety.', power_kw: 3.2, status: 'active', tag: 'CRITICAL — Product Safe' },
      { id: 'pumps', category: 'keep', title: '💧 Water Circulation Pumps', description: 'Essential circulation.', power_kw: 2.1, status: 'active', tag: 'ESSENTIAL' }
    ],
    defer_or_reduce: [
      { id: 'ice_plant', category: 'defer', title: '🧊 Ice Production Plant', description: 'Paused for 45 mins to save battery reserve.', power_kw: 0, status: 'deferred', tag: 'DEFERRED — Save 3.0 kW' },
      { id: 'processing', category: 'defer', title: '🏭 Shrimp Processing Line', description: 'Paused during peak power constraint.', power_kw: 0, status: 'deferred', tag: 'DEFERRED — Save 4.0 kW' }
    ],
    energy_strategy: [
      { id: 'strat_solar', category: 'strategy', title: '☀️ Use Solar Generation', description: `Directing ${t.solar_gen_kw} kW solar generation to critical loads.`, power_kw: t.solar_gen_kw, status: 'active', tag: 'RENEWABLE FIRST' },
      { id: 'strat_battery', category: 'strategy', title: '🔋 Battery Floor Reserve', description: 'Maintaining 20% minimum battery floor reserve.', power_kw: 0, status: 'active', tag: '20% RESERVE FLOOR' }
    ],
    soft_start_rig: {
      enabled: true,
      ramp_duration_sec: 120,
      stagger_interval_sec: 30,
      peak_inrush_prevented_kw: 14.5,
      motor_wear_reduction_pct: 35.0,
      current_step: "VFD Frequency Ramping (0 → 50 Hz)"
    },
    thermal_precool_rig: {
      enabled: t.solar_gen_kw > 14.0 || t.thermal_precooling_active,
      cold_storage_precooled_temp_c: 1.5,
      thermal_energy_stored_kwh: 6.8,
      compressor_safe_off_duration_hours: 4.2,
      solar_surplus_utilized_kw: 4.5,
      status: t.solar_gen_kw > 14.0 ? "ACTIVE — Thermal Energy Storage Mode (1.5°C)" : "STANDBY — Standard 4.0°C Mode"
    },
    requires_human_approval: event.severity === 'high',
    risk_score: event.severity === 'high' ? 83 : event.severity === 'med' ? 57 : 0
  };
}

function executeFallbackApproval(req: ApprovalRequest): ExecutionResult {
  const plan = generateFallbackPlan(req.event_id);
  const entry: AuditLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleString(),
    event_id: req.event_id,
    event_title: plan.event_title,
    action_taken: req.action.toUpperCase(),
    executed_by: "Demo Operator",
    summary: req.action === 'approve'
        ? '[PoC Simulated] Plan approved — simulated control commands dispatched to PS04 Digital Twin.'
        : req.action === 'modify'
        ? '[PoC Simulated] Plan modified by operator — re-validated and dispatched to PS04 Digital Twin.'
        : 'Execution cancelled (rejected) — zero equipment commands dispatched.',
    impact: req.action === 'reject' ? {
      energy_optimized_kwh: 0.0,
      cost_avoided_inr: 0.0,
      diesel_avoided_liters: 0.0,
      co2_avoided_kg: 0.0,
      product_protected_tons: 0.0,
      critical_ops_safety_pct: 0.0,
      aerator_inrush_suppressed_kw: 0.0,
      thermal_energy_stored_kwh: 0.0,
      timestamp: new Date().toLocaleString()
    } : {
      energy_optimized_kwh: 8.4,
      cost_avoided_inr: 79.80,
      diesel_avoided_liters: 2.1,
      co2_avoided_kg: 10.8,
      product_protected_tons: 2.8,
      critical_ops_safety_pct: 100,
      aerator_inrush_suppressed_kw: 14.5,
      thermal_energy_stored_kwh: 6.8,
      timestamp: new Date().toLocaleString()
    }
  };
  FALLBACK_AUDIT_LOGS.unshift(entry);
  return {
    status: req.action,
    message: `[PoC Simulated] Plan ${req.action}d. ${req.action === 'approve' ? 'Simulated control commands dispatched to PS04 Digital Twin. Critical loads protected in Digital Twin.' : 'Execution cancelled (rejected) — no equipment commands dispatched.'}`,
    audit_entry: entry,
    impact: entry.impact
  };
}

function getFallbackUnifiedAnalysis(inputStr: string): UnifiedAnalysisResponse {
  const text = inputStr.toUpperCase();
  let eventId = "SOLAR_DROP_60";

  if (text.includes("GRID") || text.includes("FAIL")) eventId = "GRID_FAILURE";
  else if (text.includes("DO") || text.includes("OXYGEN") || text.includes("2.9")) eventId = "POND_DO_FALLING";
  else if (text.includes("BATTERY") || text.includes("18") || text.includes("LOW")) eventId = "BATTERY_LOW_20";
  else if (text.includes("COLD") || text.includes("6.2")) eventId = "COLD_ROOM_TEMP_RISING";
  else if (text.includes("NORMAL") || text.includes("OPTIMAL")) eventId = "SOLAR_NORMAL";

  const ev = FALLBACK_EVENTS.find(e => e.id === eventId) || FALLBACK_EVENTS[0];
  const plan = generateFallbackPlan(ev.id);
  const isNormal = ev.id === 'SOLAR_NORMAL';

  return {
    analysis_id: `an-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toLocaleString(),
    event_id: ev.id,
    event_title: ev.name,
    raw_input: inputStr,
    situation: ev.description,
    risk: {
      level: isNormal ? "NORMAL" : plan.risk_score >= 75 ? "CRITICAL" : plan.risk_score >= 50 ? "HIGH" : "MEDIUM",
      score: isNormal ? 0 : plan.risk_score,
      reasons: isNormal ? ["All metrics operating within safe nominal bounds."] : [ev.description, `Risk Score: ${plan.risk_score}/100`]
    },
    agents: {
      pond: {
        agent_id: "pond",
        agent_name: "Pond Health & Aerator Specialist",
        icon: "🐟",
        status: ev.pond_state.pond_do < 3.0 ? "warning" : "ok",
        findings: [`Pond DO: ${ev.pond_state.pond_do} mg/L (${ev.pond_state.pond_do_trend})`],
        key_metrics: { "Dissolved Oxygen": `${ev.pond_state.pond_do} mg/L`, "Aerators Active": `${ev.pond_state.aerators_on}/${ev.pond_state.total_aerators}` }
      },
      energy: {
        agent_id: "energy",
        agent_name: "Energy & Microgrid Specialist",
        icon: "⚡",
        status: ev.energy_state.solar_kw < 5.0 ? "warning" : "ok",
        findings: [`Solar output: ${ev.energy_state.solar_kw} kW`, `Battery SOC: ${ev.battery_state.battery_soc}%`],
        key_metrics: { "Solar Output": `${ev.energy_state.solar_kw} kW`, "Battery SOC": `${ev.battery_state.battery_soc}%` }
      },
      cold_chain: {
        agent_id: "cold_chain",
        agent_name: "Cold Storage & Pre-Cooling Specialist",
        icon: "❄️",
        status: ev.cold_chain_state.cold_room_temp > 5.0 ? "warning" : "ok",
        findings: [`Cold Room Temp: ${ev.cold_chain_state.cold_room_temp}°C`],
        key_metrics: { "Cold Room": `${ev.cold_chain_state.cold_room_temp}°C` }
      },
      risk: {
        agent_id: "risk",
        agent_name: "Operational & Safety Risk Specialist",
        icon: "🛡️",
        status: isNormal ? "ok" : "critical",
        findings: [`Risk score calculated at ${isNormal ? 0 : plan.risk_score}/100.`],
        key_metrics: { "Risk Score": `${isNormal ? 0 : plan.risk_score}/100` }
      }
    },
    orchestration: {
      priority_order: ["Life Safety (Aeration)", "Asset Protection (Cold Chain)", "Economy (Processing)"],
      reasoning_summary: plan.orchestrator_summary
    },
    plan: {
      protect: plan.keep_running,
      defer: plan.defer_or_reduce,
      energy_strategy: plan.energy_strategy
    },
    safety: {
      policies_checked: 9,
      policies_passed: 9,
      violations: [],
      approval_required: !isNormal,
      interventions: plan.safety_interventions || []
    },
    decision: {
      status: isNormal ? "AUTO_SAFE" : "PENDING"
    },
    soft_start_rig: plan.soft_start_rig,
    thermal_precool_rig: plan.thermal_precool_rig,
    ai_used: plan.ai_used,
    ai_fallback_reason: plan.ai_fallback_reason
  };
}
