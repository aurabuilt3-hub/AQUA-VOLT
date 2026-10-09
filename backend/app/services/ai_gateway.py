import os
import time
import json
import hashlib
import logging
import httpx
from typing import Dict, Any, Tuple, Optional
from threading import Lock, Event

from app.models.schemas import (
    IoTEvent, FarmState, CoordinatedActionPlan,
    PondAgentOutput, EnergyAgentOutput, ColdChainAgentOutput, RiskAgentOutput
)
from app.services.orchestrator import build_coordinated_action_plan

logger = logging.getLogger("aquavolt.ai_gateway")
logger.setLevel(logging.INFO)

# Metrics tracking
_stats_lock = Lock()
_metrics = {
    "request_count": 0,
    "cache_hits": 0,
    "cache_misses": 0,
    "fallback_count": 0,
    "total_latency_ms": 0.0,
}

# Cache: state_hash -> (CoordinatedActionPlan, timestamp)
_cache_lock = Lock()
_cache: Dict[str, Tuple[CoordinatedActionPlan, float]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

# Deduplication: state_hash -> Event (signaling completion)
_in_flight_lock = Lock()
_in_flight: Dict[str, Event] = {}
_in_flight_results: Dict[str, CoordinatedActionPlan] = {}

# Rate Limiter state
_last_request_time = 0.0
_MIN_REQUEST_INTERVAL = 1.0  # seconds between outbound API calls to Gemini

MODEL_NAME = "gemini-2.5-flash"
GEMINI_ENDPOINT_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"

def get_api_key() -> Optional[str]:
    key = os.getenv("GEMINI_API_KEY")
    if key and key.strip():
        return key.strip()
    return None

def is_ai_configured() -> bool:
    return get_api_key() is not None

def get_ai_gateway_health() -> Dict[str, Any]:
    with _stats_lock:
        reqs = _metrics["request_count"]
        hits = _metrics["cache_hits"]
        misses = _metrics["cache_misses"]
        fallbacks = _metrics["fallback_count"]
        avg_latency = (_metrics["total_latency_ms"] / reqs) if reqs > 0 else 0.0
    
    with _cache_lock:
        c_size = len(_cache)

    configured = is_ai_configured()
    
    return {
        "ai_configured": configured,
        "ai_enabled": configured,
        "model": MODEL_NAME,
        "request_count": reqs,
        "cache_hits": hits,
        "cache_misses": misses,
        "fallback_count": fallbacks,
        "latency_avg_ms": round(avg_latency, 2),
        "cache_size": c_size,
    }

def compute_state_hash(event: IoTEvent, farm_state: FarmState) -> str:
    compact_payload = {
        "event_id": event.id,
        "solar_kw": round(farm_state.energy_state.solar_kw, 2),
        "solar_drop_pct": round(farm_state.energy_state.solar_drop_percent, 1),
        "battery_soc": round(farm_state.battery_state.battery_soc, 1),
        "grid_available": farm_state.energy_state.grid_available,
        "pond_do": round(farm_state.pond_state.pond_do, 2),
        "pond_do_trend": farm_state.pond_state.pond_do_trend,
        "cold_room_temp": round(farm_state.cold_chain_state.cold_room_temp, 2),
        "aerators_on": farm_state.pond_state.aerators_on,
        "total_load_kw": round(farm_state.energy_state.total_load_kw, 2)
    }
    raw_str = json.dumps(compact_payload, sort_keys=True)
    return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()

def call_gemini_api(compact_state: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    prompt_text = f"""
System: You are AquaVolt AI Reasoning Gateway for an industrial microgrid operating a shrimp hatchery and cold storage facility (PS04).
You receive an IoT event telemetry state and must generate a single coordinated action plan.

Rules:
1. Protect life-critical pond aeration (aerators must soft-start if inrush is high).
2. Protect cold storage temperature limits (use thermal pre-cooling if solar surplus >14kW).
3. Preserve battery SOC reserve floor at 20.0%.
4. Defer flexible loads (ice plant, processing) during low solar (<12kW) or grid failure.
5. Respond ONLY with strict valid JSON matching the requested fields.

Telemetry State:
{json.dumps(compact_state, indent=2)}

Required JSON Schema:
{{
  "critical_loads": ["aeration", "cold_storage"],
  "keep_running": ["aerators", "refrigeration", "water_pumps"],
  "defer": ["ice_production", "processing"],
  "reduce": ["non_essential_lighting"],
  "battery_action": "discharge",
  "battery_reserve_percent": 20.0,
  "grid_strategy": "standby",
  "thermal_action": "use_existing_cold_buffer",
  "aerator_action": "soft_start_with_energy_check",
  "requires_human_approval": true,
  "explanation": "Concise reasoning explaining why this plan optimizes energy and protects life-critical loads."
}}
"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt_text}]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
            "maxOutputTokens": 600
        }
    }

    url = f"{GEMINI_ENDPOINT_URL}?key={api_key}"
    
    # Retry logic (max 1 retry)
    for attempt in range(2):
        try:
            with httpx.Client(timeout=4.0) as client:
                response = client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            text = parts[0]["text"]
                            return json.loads(text)
                elif response.status_code == 429:
                    raise Exception("Gemini API Rate Limit (429 Exceeded)")
                elif response.status_code in (500, 502, 503, 504) and attempt == 0:
                    time.sleep(0.5)
                    continue
                else:
                    raise Exception(f"Gemini API returned status {response.status_code}")
        except httpx.TimeoutException:
            raise Exception("Gemini API request timed out after 4 seconds")
        except json.JSONDecodeError:
            raise Exception("Gemini API returned malformed JSON")
        except Exception as e:
            if attempt == 1:
                raise e
            time.sleep(0.5)

    raise Exception("Gemini API failed after max retries")

def orchestrate_with_ai_gateway(
    event: IoTEvent,
    farm_state: FarmState,
    pond_res: PondAgentOutput,
    energy_res: EnergyAgentOutput,
    cold_res: ColdChainAgentOutput,
    risk_res: RiskAgentOutput
) -> CoordinatedActionPlan:
    global _last_request_time

    # Always generate deterministic baseline first (so fallback is instant if needed)
    deterministic_plan = build_coordinated_action_plan(
        event=event,
        farm_state=farm_state,
        pond_res=pond_res,
        energy_res=energy_res,
        cold_res=cold_res,
        risk_res=risk_res
    )

    api_key = get_api_key()
    if not api_key:
        logger.info("AI Gateway: GEMINI_API_KEY not configured. Using Safe Optimization Mode (Deterministic).")
        deterministic_plan.ai_used = False
        deterministic_plan.ai_fallback_reason = "GEMINI_API_KEY not configured"
        with _stats_lock:
            _metrics["fallback_count"] += 1
        return deterministic_plan

    state_hash = compute_state_hash(event, farm_state)

    # 1. Application-level Cache Check
    now = time.time()
    with _cache_lock:
        if state_hash in _cache:
            cached_plan, cached_time = _cache[state_hash]
            if (now - cached_time) < CACHE_TTL_SECONDS:
                logger.info(f"AI Gateway: Cache HIT for state hash {state_hash[:8]}")
                with _stats_lock:
                    _metrics["request_count"] += 1
                    _metrics["cache_hits"] += 1
                return cached_plan

    # 2. Request Deduplication Check
    is_initiator = False
    with _in_flight_lock:
        if state_hash in _in_flight:
            event_obj = _in_flight[state_hash]
        else:
            event_obj = Event()
            _in_flight[state_hash] = event_obj
            is_initiator = True

    if not is_initiator:
        logger.info(f"AI Gateway: Deduplicating concurrent request for state hash {state_hash[:8]}")
        completed = event_obj.wait(timeout=4.5)
        if completed:
            with _in_flight_lock:
                if state_hash in _in_flight_results:
                    with _stats_lock:
                        _metrics["request_count"] += 1
                        _metrics["cache_hits"] += 1
                    return _in_flight_results[state_hash]

    # 3. Rate Limiting Check
    with _stats_lock:
        _metrics["request_count"] += 1
        _metrics["cache_misses"] += 1

    time_since_last = now - _last_request_time
    if time_since_last < _MIN_REQUEST_INTERVAL:
        logger.warning(f"AI Gateway: Rate limit throttle active ({time_since_last:.2f}s < {_MIN_REQUEST_INTERVAL}s). Fallback to Safe Optimization Mode.")
        deterministic_plan.ai_used = False
        deterministic_plan.ai_fallback_reason = f"Rate limit throttle ({round(time_since_last, 2)}s interval)"
        with _stats_lock:
            _metrics["fallback_count"] += 1
        _cleanup_in_flight(state_hash, deterministic_plan)
        return deterministic_plan

    _last_request_time = time.time()

    # 4. Invoke Gemini with Timeout & Retries
    start_time = time.time()
    event_name = getattr(event, "name", None) or getattr(event, "title", None) or event.id
    compact_state = {
        "event_id": event.id,
        "event_name": event_name,
        "solar_kw": farm_state.energy_state.solar_kw,
        "solar_drop_pct": farm_state.energy_state.solar_drop_percent,
        "battery_soc": farm_state.battery_state.battery_soc,
        "grid_available": farm_state.energy_state.grid_available,
        "pond_do": farm_state.pond_state.pond_do,
        "pond_do_trend": farm_state.pond_state.pond_do_trend,
        "cold_room_temp": farm_state.cold_chain_state.cold_room_temp,
        "aerators_on": farm_state.pond_state.aerators_on,
        "total_load_kw": farm_state.energy_state.total_load_kw,
        "pond_status": pond_res.pond_status,
        "energy_status": energy_res.energy_status,
        "cold_chain_status": cold_res.cold_chain_status,
        "overall_risk": risk_res.overall_risk,
        "risk_score": risk_res.overall_risk_score
    }

    try:
        raw_output = call_gemini_api(compact_state, api_key)
        
        # 5. Structured Output Validation
        ai_keep_running = list(raw_output.get("keep_running", deterministic_plan.keep_running))
        if "aerators" not in ai_keep_running:
            ai_keep_running.append("aerators")

        ai_plan = CoordinatedActionPlan(
            event_id=event.id,
            event_name=event_name,
            critical_loads=raw_output.get("critical_loads", deterministic_plan.critical_loads),
            keep_running=ai_keep_running,
            defer=raw_output.get("defer", deterministic_plan.defer),
            reduce=raw_output.get("reduce", deterministic_plan.reduce),
            battery_action=raw_output.get("battery_action", deterministic_plan.battery_action),
            battery_reserve_percent=max(20.0, float(raw_output.get("battery_reserve_percent", 20.0))),
            grid_strategy=raw_output.get("grid_strategy", deterministic_plan.grid_strategy),
            thermal_action=raw_output.get("thermal_action", deterministic_plan.thermal_action),
            aerator_action=raw_output.get("aerator_action", deterministic_plan.aerator_action),
            requires_human_approval=deterministic_plan.requires_human_approval or bool(raw_output.get("requires_human_approval", False)),
            explanation=raw_output.get("explanation", deterministic_plan.explanation),
            ai_used=True,
            ai_fallback_reason=None
        )

        latency_ms = (time.time() - start_time) * 1000.0
        logger.info(f"AI Gateway: Successfully generated structured AI action plan for '{event_name}' in {latency_ms:.1f}ms")

        with _stats_lock:
            _metrics["total_latency_ms"] += latency_ms

        # Cache result
        with _cache_lock:
            _cache[state_hash] = (ai_plan, time.time())

        _cleanup_in_flight(state_hash, ai_plan)
        return ai_plan

    except Exception as exc:
        latency_ms = (time.time() - start_time) * 1000.0
        reason = str(exc)
        logger.warning(f"AI Gateway: Gemini reasoning failed ({reason}). Falling back to Safe Optimization Mode.")
        
        deterministic_plan.ai_used = False
        deterministic_plan.ai_fallback_reason = reason
        
        with _stats_lock:
            _metrics["fallback_count"] += 1
            _metrics["total_latency_ms"] += latency_ms

        _cleanup_in_flight(state_hash, deterministic_plan)
        return deterministic_plan

def _cleanup_in_flight(state_hash: str, plan: CoordinatedActionPlan):
    with _in_flight_lock:
        if state_hash in _in_flight:
            _in_flight_results[state_hash] = plan
            event_obj = _in_flight.pop(state_hash)
            event_obj.set()
