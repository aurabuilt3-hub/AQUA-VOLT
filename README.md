# ⚡ AquaVolt — Smart Energy for Healthy Aquaculture (PS04)

> **PS04 Problem Statement**: *"Shrimp Hatcheries & Cold Storage: Thermal Pre-Cooling and Aerator Soft-Start Rig."*
>
> **Core Concept**: AquaVolt is an intelligent agentic energy orchestration and governance layer connecting IoT telemetry, renewable solar generation, battery reserves, electrical loads, shrimp pond health, cold storage preservation, deterministic safety policies, human approval gates, and a simulated PS04 Digital Twin.

---

> **⚠️ PoC Simulation Notice**: The current hackathon implementation is a **Proof-of-Concept (PoC)**. The control execution layer is a **Simulated Equipment Response** module executed against the **PS04 Digital Twin** — it does NOT communicate with or control any physical equipment, relays, VFDs, or electrical hardware. The architecture is **Hardware Integration Ready**: each simulated command maps 1-to-1 to a real ESP32 MQTT command, VFD frequency ramp signal, or contactor relay API in the next integration stage. This PoC validates the orchestration, safety, governance, and decision layers.

---

## 🏗️ 1. Architecture Overview

AquaVolt adapts the multi-agent orchestration and governance architecture from **AgentShield**, tailored strictly for aquaculture microgrids and cold-chain operations.

```
                    AQUAVOLT CONTROL SYSTEM
                               │
                       Incoming IoT Event
                               │
                               ▼
                    State / Context Engine
                     (Normalized Shared State)
                               │
                               ▼
                       Agent Orchestrator
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
      Pond Agent          Energy Agent       Cold Chain Agent
    (DO & Aeration)      (Solar & Battery)   (Thermal Buffer)
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                           Risk Agent
                  (Unified Operational Risk 0–100)
                               │
                               ▼
                   Deterministic Decision Engine
            (Load Priority · Deficit Allocation · Inrush Limits)
                               │
                               ▼
                     Safety / Policy Engine
                  (9 Deterministic Hard Rules)
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                 Low Risk             High Risk
             (Auto Execution)      (Human Approval)
                    │                     │
                    └──────────┬──────────┘
                               │
                               ▼
                   Controlled Tool Gateway
            (Tool Verification · Safety & Approval Check)
                               │
                               ▼
                       PS04 Digital Twin
                      ┌────────┴────────┐
                      ▼                 ▼
               Aerator Soft-Start   Thermal Pre-Cooling
               (Inrush Clamped)     (Thermal Buffer)
                               │
                               ▼
                         Impact Engine
                   (PoC Estimated Metrics)
                               │
                               ▼
                    Governance Audit Trail
               (End-to-End Cryptographic Provenance)
```

---

## 🛡️ 2. AgentShield Migration Map

| AgentShield Component | AquaVolt Equivalent | Action | Rationale |
|---|---|---|---|
| **Agent Orchestration** | `Orchestrator` (`orchestrator.py`) | **ADAPT** | Retained multi-stage coordination pipeline, customized for domain telemetry instead of generic NLP. |
| **Agent Communication** | Normalized Shared State (`context_engine.py`) | **ADAPT** | Compact, typed JSON state prevents context bloat and guarantees zero hallucination in numerical thresholds. |
| **Deterministic Policy Engine** | Safety Engine (`safety.py`) | **REUSE** | Evaluates 9 deterministic PS04 hard policies with explicit block/repair actions and human-readable explanations. |
| **Human-in-the-Loop Workflow** | Approval Engine (`governance/approvals.py`) | **REUSE** | Full approval lifecycle: `PENDING` → `APPROVED` / `MODIFIED` / `REJECTED`, recording reviewer and notes. |
| **Authorized Tool Gateway** | Controlled Tool Gateway (`tool_gateway.py`) | **REUSE** | Enforces separation between agent recommendations and execution. Validates tool registry, parameters, policies, and human approval before dispatching to twin. |
| **Audit Logging & Tracing** | Governance Audit Logger (`governance/audit.py`) | **REUSE** | Structured event logging tracking the complete lifecycle from IoT ingestion to twin impact. |
| **AI Gateway Fallback** | AI Gateway (`ai_gateway.py`) | **ADAPT** | Application caching, rate limiting (1.0s), 4.0s timeout, deduplication, and automatic fallback to Safe Optimization Mode. |
| **Generic Enterprise RBAC / SSO** | N/A | **DO NOT USE** | Excluded corporate identity and enterprise LDAP/SSO to keep AquaVolt lightweight and PS04-focused. |
| **PII / DLP Scanners** | N/A | **DO NOT USE** | Aquaculture microgrid telemetry does not involve social security or credit card numbers. |
| **Vector DB / Qdrant / Reranker** | N/A | **DO NOT USE** | Microgrid operational rules are deterministic and real-time; vector search is unnecessary overhead. |
| **RAGAS Benchmark Suite** | Backend Pytest Suite (`test_aquavolt.py`, `test_agentshield_integration.py`) | **ADAPT** | Replaced with 126 deterministic unit & integration tests validating domain rules and safety gates. |

---

## 🔄 3. Core 8-Step User Journey

AquaVolt simplifies complex multi-domain microgrid decisions into an intuitive 8-step journey:

1. **LIVE IoT EVENT**: Ingests telemetry signals (e.g., sudden 60% solar drop, battery reserve floor, dissolved oxygen decline, cold-room temperature spike, grid failure).
2. **WHAT AQUAVOLT FOUND**: 4 specialist agents analyze the normalized telemetry state:
   - 🐟 **Pond Health Specialist**: Dissolved oxygen (mg/L), pond temp, aerator status.
   - ⚡ **Energy & Microgrid Specialist**: Solar generation, battery SOC, grid availability, load balance.
   - ❄️ **Cold Storage Specialist**: Cold room temp, thermal buffer, pre-cooling status.
   - 🛡️ **Operational Risk Specialist**: Unified risk score (0–100), risk tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), human approval requirement.
3. **WHAT AQUAVOLT RECOMMENDS**: Load Prioritization Plan created by Deterministic Decision Engine:
   - **🟢 Keep Running (P1 Critical)**: Aerators (VFD Soft-Start), Cold Storage Refrigeration, Circulation Pumps.
   - **🟠 Defer / Reduce (Flexible Loads)**: Ice Production Plant (45m pause), Shrimp Processing Line, Auxiliary Lighting.
   - **⚡ Supply Strategy**: Renewable solar priority, 20% battery floor protection, grid standby.
4. **SAFETY CHECK**: Authoritative Safety Engine evaluates 9 deterministic policies, blocking unsafe actions and auto-repairing plans where necessary.
5. **HUMAN APPROVAL**: Operator reviews high-risk plans with explicit controls: `✓ Approve Plan`, `✎ Modify Plan`, `✕ Reject Plan`.
6. **EXECUTION**: Controlled Tool Gateway verifies authorization and dispatches simulated commands to the PS04 Digital Twin.
7. **IMPACT**: PoC-modelled impact metrics: energy optimized (kWh), cost avoided (₹), diesel saved (L), CO₂ avoided (kg), inrush surge suppressed (kW), thermal energy stored (kWh).
8. **AUDIT**: Complete cryptographic audit trail recording all 8 stages.

---

## ⚙️ 4. PS04 Specialist Hardware Rigs (Simulated in PoC)

### 1. Simulated VFD Soft-Start Sequence
Direct-On-Line (DOL) startup of aerator motors draws up to **350% inrush current** (18.5 kW peak surge), tripping inverter breakers and degrading batteries.
- **AquaVolt Decision**: Models a Variable Frequency Drive (VFD) frequency ramp over 120 seconds with staggered 30-second motor starts.
- **PoC Impact (Simulated)**: Clamps simulated peak from 18.5 kW down to 6.4 kW and models +35% motor lifespan improvement.
- **Hardware Integration Ready**: In a deployed system, this maps to an ESP32 sending a Modbus frequency ramp command to a real VFD controller over MQTT.

### 2. Simulated Thermal Pre-Cooling Control
Converts the thermal mass of the cold storage room into a zero-cost thermal energy storage battery.
- **AquaVolt Decision**: During midday solar surplus (> 14.0 kW), lowers the cold storage setpoint from 4.0°C to 1.5°C, storing ~6.8 kWh of thermal energy.
- **PoC Impact (Simulated)**: Enables safe compressor-off windows of up to **4.2 hours** during low-solar or outage conditions without risking product spoilage.
- **Hardware Integration Ready**: In a deployed system, this maps to an ESP32 GPIO relay controlling the compressor thermostat setpoint.

---

## 🔒 5. Safety Engine — 9 Deterministic Policies

The Safety Engine is the authoritative last gate between upstream recommendations and execution:

| # | Policy | Condition | Enforcement |
|---|---|---|---|
| **1** | Critical Aeration Protection | Pond DO < 3.5 mg/L | Hard block deferral + Lock aerators to P1 Keep Running with VFD ramp |
| **2** | Cold Storage Temperature Limit | Cold Room Temp > 5.0°C | Hard block compressor pause + Force active refrigeration cooling |
| **3** | Battery Reserve Floor Protection | Battery SOC < 20.0% | Hard block discharge + Lock battery to emergency reserve floor |
| **4** | Inverter Peak Load Limit | Total Active Load > 22.0 kW | Shed flexible loads (ice plant & processing) to clamp peak load ≤ 22 kW |
| **5** | Aerator Soft-Start Constraint | Inrush Surge > 10.0 kW or DOL start | Force 120s VFD frequency ramp with 30s staggered motor starts |
| **6** | Thermal Pre-Cooling Boundaries | Pre-cooling setpoint | Strict boundary check: must stay within 1.0°C (freeze limit) to 4.5°C |
| **7** | High-Risk Action Human Approval | Repaired action or safety breach | Enforce mandatory human operator approval gate before execution |
| **8** | Sensor Data Reliability Check | Missing, zero, or out-of-range sensor | Switch to Conservative Fallback Mode (Full aeration + standard cooling) |
| **9** | Mandatory High-Severity Approval | IoT Event severity = HIGH | Authoritative gate — cannot be bypassed by Orchestrator or AI Gateway |

---

## 🛠️ 6. Controlled Tool Gateway

Agents recommend actions; **they never execute tools directly**. The Tool Gateway manages 7 authorized PS04 tools:

1. `startAeratorSoftStart(ramp_seconds=120, stagger_seconds=30)`: Initiates VFD ramp.
2. `stopAerator(aerator_ids=[...])`: Shuts down non-critical aerators (blocked if DO < 3.5 mg/L).
3. `startPrecooling(target_temp_c=1.5)`: Drives cold storage to 1.5°C using solar surplus.
4. `reduceCoolingLoad()`: Pauses compressor to float on thermal buffer (blocked if temp > 5.0°C).
5. `pauseIceProduction(duration_minutes=45)`: Defers 3.0 kW ice maker load.
6. `pauseProcessing(duration_minutes=60)`: Defers 4.0 kW processing line load.
7. `maintainBatteryReserve(floor_soc_pct=20.0)`: Locks BMS discharge floor.

---

## 🤖 7. AI Gateway & Safe Fallback Strategy

AquaVolt uses an optional **AI Reasoning Gateway** with Gemini 2.5 Flash:
- **Max 1 reasoning call** per unique telemetry event.
- **Request deduplication** for concurrent queries.
- **Application-level caching** (5-minute TTL).
- **Rate limiting** (1.0 second minimum interval).
- **Strict 4.0-second timeout** with 1 retry.
- **Structured JSON output** validation.
- **Safe Optimization Mode (Fallback)**: If `GEMINI_API_KEY` is not provided, if Gemini returns HTTP 429, times out, or produces invalid output, AquaVolt instantly falls back to 100% deterministic rules. The application remains fully functional.
- **No API keys in frontend code**: Keys reside strictly on the server and are never exposed via endpoints.

---

## 📁 8. Project Structure

```
aquavolt/
├── backend/                      # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS & routes
│   │   ├── api/
│   │   │   └── routes.py         # REST endpoints (events, plan, approve, tools, twin, audit)
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic schemas (telemetry, state, agents, plan, twin)
│   │   ├── governance/           # AgentShield Governance Integration
│   │   │   ├── approvals.py      # Approval state machine (PENDING, APPROVED, MODIFIED, REJECTED)
│   │   │   └── audit.py          # Cryptographic audit logging & lifecycle tracing
│   │   └── services/
│   │       ├── context_engine.py # Normalized shared state generator
│   │       ├── decision_engine.py# Deterministic load priority & rig parameters
│   │       ├── telemetry.py      # 10 deterministic IoT scenario presets
│   │       ├── pond_agent.py     # Dissolved Oxygen & Aerator Soft-Start Specialist
│   │       ├── energy_agent.py   # Solar & Battery Microgrid Specialist
│   │       ├── cold_chain_agent.py # Cold Storage & Thermal Pre-Cooling Specialist
│   │       ├── risk_agent.py     # Operational & Safety Risk Specialist (0–100 score)
│   │       ├── safety.py         # 9-policy deterministic safety rule engine
│   │       ├── tool_gateway.py   # Controlled Tool Gateway (Registry, Validation, Dispatch)
│   │       ├── digital_twin.py   # PS04 Digital Twin PoC Simulation Engine
│   │       ├── orchestrator.py   # Multi-agent action plan coordinator
│   │       ├── control_layer.py  # Simulation runner & audit integration
│   │       ├── impact.py         # PoC-modelled ROI & impact calculator
│   │       ├── ai_gateway.py     # Gemini AI Gateway (Cache, Timeout, Fallback)
│   │       └── copilot.py        # Rule-based domain assistant
│   ├── tests/
│   │   ├── test_aquavolt.py              # 100 core domain tests
│   │   └── test_agentshield_integration.py # 26 AgentShield governance & gateway tests
│   └── requirements.txt
├── frontend/                     # React + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/           # Preserved visual components
│   │   │   ├── Header.tsx
│   │   │   ├── MetricsBanner.tsx
│   │   │   ├── EventSelector.tsx
│   │   │   ├── AgentAnalysis.tsx
│   │   │   ├── SituationCard.tsx
│   │   │   ├── ActionPlan.tsx
│   │   │   ├── SafetyInterventionPanel.tsx
│   │   │   ├── SoftStartRigVisualizer.tsx
│   │   │   ├── HumanApproval.tsx
│   │   │   ├── ExecutionSimulator.tsx
│   │   │   ├── ImpactSection.tsx
│   │   │   ├── PS04DigitalTwin.tsx
│   │   │   ├── PS04RigView.tsx
│   │   │   ├── AuditLogModal.tsx
│   │   │   ├── CopilotModal.tsx
│   │   │   └── DemoMode.tsx
│   │   ├── services/api.ts       # Backend API client with offline fallback
│   │   ├── types/index.ts        # TypeScript contract interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared/
│   └── schemas.json              # Shared JSON contract schema
├── .env.example                  # Environment configuration template
├── start.py                      # One-command full-stack starter script
└── README.md
```

---

## 🚀 9. Quick Start Instructions

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14)
- **Node.js**: 18+ (tested on Node.js v20)
- **npm**: 10+

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Environment Setup
Copy the template environment file:
```bash
cp .env.example .env
```
*(Optional)* Add your Gemini API key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
If left blank, AquaVolt runs in 100% deterministic **Safe Optimization Mode**.

### Step 3: Run the Application

**Option A: 1-Command Starter Script (Recommended)**
```bash
python start.py
```

**Option B: Separate Terminal Windows**

Terminal 1 (Backend):
```bash
cd backend
python -m uvicorn app.main:app --port 8000 --reload
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev -- --port 3000
```

### Step 4: Open in Browser
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **AI Gateway Health**: [http://localhost:8000/api/ai/health](http://localhost:8000/api/ai/health)
- **Digital Twin State**: [http://localhost:8000/api/digital-twin/state](http://localhost:8000/api/digital-twin/state)
- **Tool Gateway Catalog**: [http://localhost:8000/api/tools](http://localhost:8000/api/tools)

### Step 5: Run Automated Tests
```bash
cd backend
python -m pytest tests/test_aquavolt.py tests/test_agentshield_integration.py -v
```
Expected result: **126 passed** ✅

### Step 6: Production Build Test
```bash
cd frontend
npm run build
```
Expected result: `tsc && vite build` completes cleanly with 0 errors.

---

## 🎯 10. 30-Second Judge Demo Walkthrough

1. Open [http://localhost:3000](http://localhost:3000).
2. Click the default event: **`Solar generation dropped 60%`** (Event 1).
3. **What AquaVolt Found**: Point to the 4 specialist agent cards:
   - Energy Agent reports available capacity drop from 18.4 kW → 4.1 kW.
   - Pond Agent flags aerator readiness with VFD Soft-Start clamp.
   - Cold Chain Agent maintains cold storage refrigeration.
   - Risk Agent flags high operational risk (Score: 83/100) requiring mandatory approval.
4. **What AquaVolt Recommends**: Point to the load prioritization plan:
   - P1 Critical: Aerators & Cold Storage preserved.
   - Flexible: Ice production paused (45m), Processing line deferred.
5. **Safety Check**: Point to the Safety Engine Interventions panel showing Policy 3, Policy 5, and Policy 9 enforced.
6. **Human Approval**: Click **`✓ Approve Plan`**.
7. **Execution & Digital Twin**: Watch the PoC Digital Control Layer dispatch simulated commands to the PS04 Digital Twin (Inrush surge clamped 18.5 kW → 6.4 kW; battery 20% floor locked).
8. **Impact & Audit**: Point to the estimated savings and click **`🕘 Audit Trail`** in the header to show the full lifecycle trace.

---

## 📋 Approved Terminology Reference

| ✅ Approved Term | ❌ Avoid |
|---|---|
| PoC Digital Control View | "Hardware Control Panel" |
| Simulated Equipment Response | "Hardware dispatch" / "Equipment dispatch" |
| Digital Twin Representation of PS04 Rig | "Physical rig" / "Hardware rig" |
| Simulated VFD Soft-Start Sequence | "VFD dispatched to physical motors" |
| Simulated Thermal Pre-Cooling Control | "Compressor relay activated on site" |
| Hardware Integration Ready | "Controls live hatchery equipment" |
| PoC-modelled estimated impact | "Real-world measured impact" |
