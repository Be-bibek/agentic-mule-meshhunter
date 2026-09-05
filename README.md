# 🛡️ Mule Ring Sentinel
### Autonomous Agentic AI Platform for Financial Crime Detection & Syndicate Dismantlement

![Razorpay AI Buildathon 2026](https://img.shields.io/badge/Razorpay_AI_Buildathon_2026-Track_02_Risk_Manager-FF4444.svg?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Pitch_Ready-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
![Rust](https://img.shields.io/badge/Rust-PyO3_Core-000000.svg?logo=rust&style=flat-square)
![Python](https://img.shields.io/badge/Python-FastAPI_Agent-009688.svg?logo=fastapi&style=flat-square)
![React](https://img.shields.io/badge/React-Vite_Canvas_UI-61DAFB.svg?logo=react&style=flat-square)
![GPT-4o](https://img.shields.io/badge/GPT--4o-LLM_Agent-74aa9c.svg?logo=openai&style=flat-square)

![Mule Ring Sentinel Hero Banner](assets/hero-banner.svg)

> **"Last year, India's banking ecosystem lost thousands of crores to Money Mule Networks. These aren't isolated fraudsters — they are sophisticated, geographically distributed financial syndicates. Mule Ring Sentinel was built to hunt them."**

![Platform Statistics](assets/statistics.svg)

---

## 📌 Table of Contents

1. [The Problem](#-the-problem-why-traditional-ml-fails)
2. [The Solution](#-the-solution-agentic-graphrag)
3. [System Architecture](#-system-architecture)
4. [Tech Stack Deep Dive](#-tech-stack-deep-dive)
5. [Data Flow Architecture](#-data-flow-architecture)
6. [Agent Reasoning Loop](#-agent-reasoning-loop)
7. [API Reference](#-api-reference)
8. [Performance Benchmarks](#-performance-benchmarks)
9. [UI Views](#-ui-views)
10. [Quickstart](#-quickstart)
11. [Project Structure](#-project-structure)

---

## 🚨 The Problem: Why Traditional ML Fails

Standard fraud engines (XGBoost, LightGBM, rule-engines) score **individual transactions**. They are fundamentally blind to network-level coordination.

Organized Money Mule Syndicates exploit this directly:
- They **slice stolen funds** across 10–30 clean accounts, keeping each individual transaction below the risk threshold.
- They use **circular layering flows** (A→B→C→A) to obscure the money trail.
- They deploy **shared device/IP infrastructure** across seemingly unrelated accounts.
- By the time rules trigger on volume, **the money has exited the ecosystem**.

> Traditional ML cannot see the ring. It only sees individual transactions.

![Problem vs Solution](assets/problem-solution.svg)

---

## 🤖 The Solution: Agentic GraphRAG

**Mule Ring Sentinel** solves this using a three-layer architecture:

1. **⚡ Rust-Powered Ingestion Core** — A PyO3 extension module that ingests synthetic transaction streams at near-native speed (2.1x faster than Python), building a live graph state machine.
2. **🧠 GPT-4o Agentic Investigator** — An autonomous AI agent with specialized Graph Tools that "walks" the transaction network—tracing neighbors, detecting circular flows, calculating betweenness centrality—until it compiles a legal-grade evidence package with a structured `RingVerdict`.
3. **🎨 Premium React Canvas Dashboard** — A high-performance, Force-Directed Graph rendered at 60fps on an HTML5 Canvas, with India Geo-Heatmap corridors, real-time agent telemetry via WebSocket, and an Executive Bento mode for risk officers.

---

## 🏗️ System Architecture

![Detailed System Architecture](assets/detailed-architecture.svg)

```mermaid
graph TB
    subgraph INGESTION["⚡ Layer 1 — High-Performance Ingestion"]
        A[("📄 Synthetic Transaction Stream")]
        B["🦀 Rust PyO3 Core (serde_json + PyO3)"]
        C["🐍 Python Graph Engine (NetworkX)"]
        A -->|"Sub-ms parsing, 2.1x faster"| B
        B -->|"Pre-compiled edge tuples via FFI"| C
    end

    subgraph AGENT["🧠 Layer 2 — Agentic Reasoning"]
        D["🤖 GPT-4o Agent (MuleRingInvestigator)"]
        E["🛠️ Graph Tools: get_neighbors, trace_circular_flow, check_device_overlap, calculate_centrality"]
        F["✅ Pydantic Evidence Builder (RingVerdict)"]
        C <-->|"Tool Calls"| E
        E <-->|"Agentic Loop, max 10 steps"| D
        D -->|"Structured JSON Output"| F
    end

    subgraph API["🌐 Layer 3 — FastAPI Orchestration"]
        G["🚀 FastAPI Server (Uvicorn ASGI)"]
        H["📡 WebSocket Manager (Real-time Telemetry)"]
        F -->|"Investigation Report"| G
        G <-->|"Broadcast Agent Thoughts"| H
    end

    subgraph FRONTEND["🎨 Layer 4 — Premium React Dashboard"]
        I["📊 Executive Bento Dashboard"]
        J["🗺️ India Geo Heatmap (SVG)"]
        K["🕸️ Graph Topology (ForceGraph2D / Canvas)"]
        H <-->|"ws:// Live Feed"| I
        H <-->|"ws:// Live Feed"| K
    end
```

---

## 🧩 Tech Stack Deep Dive

### <img src="https://img.shields.io/badge/Layer_1-Rust_PyO3_Core-000000.svg?logo=rust&style=flat-square" alt="Rust" align="center" />
| Component | Technology | Purpose |
|---|---|---|
| Native Extension | `Rust + PyO3 0.20` | Zero-copy Python-Rust FFI boundary |
| Serialization | `serde + serde_json` | Schema-validated transaction parsing |
| Build Tool | `maturin` | Compiles Rust into a `.pyd` Python extension module |

### <img src="https://img.shields.io/badge/Layer_2-Python_AI_Agent-009688.svg?logo=python&style=flat-square" alt="Python" align="center" />
| Component | Technology | Purpose |
|---|---|---|
| Agent LLM | `GPT-4o` via OpenAI SDK | Multi-step autonomous reasoning with tool calling |
| Fallback | `Anthropic Claude` | Graceful degradation if OpenAI unavailable |
| Graph Engine | `NetworkX` | In-memory directed transaction graph |
| Data Validation | `Pydantic v2` | Strict schema enforcement on all Agent outputs |
| Numeric | `NumPy + Pandas` | Centrality score computation |

### <img src="https://img.shields.io/badge/Layer_3-Backend_Orchestration-009688.svg?logo=fastapi&style=flat-square" alt="FastAPI" align="center" />
| Component | Technology | Purpose |
|---|---|---|
| Web Framework | `FastAPI` | Async REST + WebSocket endpoints |
| ASGI Server | `Uvicorn (standard)` | High-performance async server |
| Real-time | `WebSockets` | Streams Agent thoughts/actions to UI live |
| Evaluation | `scikit-learn` | Precision/Recall scoring against ground truth |

### <img src="https://img.shields.io/badge/Layer_4-React_Frontend-61DAFB.svg?logo=react&style=flat-square" alt="React" align="center" />
| Component | Technology | Purpose |
|---|---|---|
| Framework | `React 18 + Vite` | Ultra-fast HMR dev server |
| Language | `TypeScript` | Full type-safety across 1500+ lines of UI logic |
| Graph Rendering | `react-force-graph-2d` | D3 physics on HTML5 Canvas |
| Physics Engine | `D3-Force` | Custom bounding-box force, charge tuning |
| Maps | `React Simple Maps + D3` | SVG-based India GeoJSON heatmap |
| Styling | `Tailwind CSS v3` | Dark/light mode, utility-first tokens |

---

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant UI as React UI
    participant API as FastAPI
    participant Agent as GPT-4o Agent
    participant Graph as NetworkX Engine
    participant WS as WebSocket

    UI->>API: POST /api/agent/investigate { node_id }
    API-->>UI: 202 Accepted (less than 10ms)
    API->>WS: Broadcast: investigation_started
    WS-->>UI: Live: Agent dispatched

    loop Agentic Tool-Call Loop (max 10 steps)
        Agent->>API: Tool Call: get_neighbors(node_id)
        API->>Graph: engine.get_neighbors()
        Graph-->>API: neighbors[]
        API-->>Agent: JSON result
        API->>WS: Broadcast: agent_action { tool, result_size }
        WS-->>UI: Live Terminal log update

        Agent->>API: Tool Call: trace_circular_flow(node_id)
        API->>Graph: engine.trace_circular_flow()
        Graph-->>API: circular_paths[]
        API-->>Agent: JSON result

        Agent->>API: Tool Call: check_device_overlap(node_ids[])
        API->>Graph: engine.check_device_overlap()
        Graph-->>API: shared_devices{}
        API-->>Agent: JSON result
    end

    Agent->>API: Final Verdict (RingVerdict JSON)
    API->>WS: Broadcast: investigation_complete { verdict }
    WS-->>UI: Graph highlights ring members
    UI->>UI: Freeze Ring: nodes turn grey, escrow locked
```

---

## 🧠 Agent Reasoning Loop

```mermaid
flowchart TD
    A["User clicks Run Agentic Scan"] --> B["POST /api/agent/investigate"]
    B --> C["Background Task dispatched via ThreadPoolExecutor"]
    C --> D["GPT-4o receives System Prompt and target node_id"]
    D --> E{"Agent decides next tool to call"}
    E -->|"get_neighbors"| F["NetworkX: BFS traversal, returns direct connections"]
    E -->|"trace_circular_flow"| G["NetworkX: DFS cycle detection, returns closed loop paths"]
    E -->|"check_device_overlap"| H["NetworkX: Shared device node lookup, returns synthetic linkage proof"]
    E -->|"calculate_centrality"| I["NumPy: Betweenness centrality, identifies hub accounts"]
    F & G & H & I --> J["Tool result appended to message history"]
    J --> K{"More than 10 steps or no tool call?"}
    K -->|"No, keep investigating"| E
    K -->|"Yes, finalize"| L["GPT-4o: Generate structured RingVerdict JSON"]
    L --> M{"Pydantic validation passed?"}
    M -->|"Yes"| N["InvestigationReport saved, broadcast via WebSocket"]
    M -->|"Error"| O["Fallback: Mock Investigation using real graph data"]
    N --> P["UI: Graph freezes ring members, Escrow lock badge appears"]
```

---

## 📡 API Reference

### Agent Endpoints

| Method | Endpoint | Description | Response |
|---|---|---|---|
| `POST` | `/api/agent/investigate` | Dispatch autonomous investigation | `202 Accepted` |
| `WS` | `/api/ws/investigation` | Real-time agent telemetry stream | WebSocket events |

### Graph Engine Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/investigate/neighbors/{node_id}` | BFS neighborhood traversal (depth-configurable) |
| `GET` | `/api/investigate/circular_flow/{node_id}` | DFS cycle detection for money laundering rings |
| `POST` | `/api/investigate/device_overlap` | Shared device/IP linkage analysis |
| `POST` | `/api/investigate/centrality` | Betweenness centrality for hub detection |

### Data Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/graph/accounts` | Serve accounts JSON for visualization |
| `GET` | `/api/graph/transactions` | Serve transaction edges for visualization |

### WebSocket Event Schema

```json
{ "type": "investigation_started", "target": "ACC-88219", "message": "Agent dispatched" }
{ "type": "agent_action", "action": "trace_circular_flow", "target": "ACC-88219", "result_size": 3 }
{ "type": "investigation_complete", "target": "ACC-88219", "verdict": { "is_mule_ring": true, "confidence_score": 0.994 } }
```

---

## 📊 Performance Benchmarks

Benchmarked on **25,000 synthetic transaction records** (JSON read + parse + edge construction):

| Engine | Time | Throughput | vs. Python |
|---|---|---|---|
| Pure Python (json + dict) | 45.29 ms | 552,019 txns/sec | 1.0x (baseline) |
| **Rust PyO3 Core** | **21.58 ms** | **1,158,389 txns/sec** | **2.1x faster** |

The Rust core unlocks line-rate graph construction, enabling real-time ingestion before the LLM agent is invoked.

---

## 🖥️ UI Views

The frontend provides **4 premium, switchable views**:

| View | Description |
|---|---|
| <img src="https://img.shields.io/badge/Executive-Bento_Dashboard-5b21b6.svg?style=flat-square" alt="Bento" /> | Cards-based mission control for CISOs. Shows all 5 active threat syndicates with risk scores, volumes, mule counts and topology type. |
| <img src="https://img.shields.io/badge/India-Geo_Heatmap-dc2626.svg?style=flat-square" alt="Map" /> | SVG-rendered map of India with glowing cyber-crime hubs (Jamtara, Delhi NCR, BKC Mumbai) and animated threat corridor flow arcs. |
| <img src="https://img.shields.io/badge/Graph-Topology-0ea5e9.svg?style=flat-square" alt="Graph" /> | Interactive ForceGraph2D with two modes: **Structured Layout** (geometric, perfectly locked constellation) and **Organic Layout** (D3-physics with a custom closed-box bounding force). |
| <img src="https://img.shields.io/badge/Dual-Sync_View-10b981.svg?style=flat-square" alt="Sync" /> | Side-by-side Geo-Heatmap + Graph Topology for geographic-to-network correlation. |

---

## 🚀 Quickstart

**Prerequisites:** Python 3.10+, Node.js 18+, Rust + Cargo

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows:
.\\venv\\Scripts\\Activate.ps1
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Compile the Rust core
cd rust_core && maturin develop --release && cd ..

# Optional: Add your OpenAI API key (falls back to mock if not set)
cp .env.example .env

# Generate synthetic data
python scripts/generate_data.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Benchmarks & Evaluation

```bash
cd backend
python benchmarks/benchmark_ingestion.py   # Rust vs Python speed
python scripts/evaluate.py                 # Precision/Recall vs ground truth
```

---

## 📁 Project Structure

```
mule-ring-sentinel/
├── README.md
├── frontend/                              # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx                        # Root app, graph state, D3 physics
│       ├── components/
│       │   ├── ExecutiveBentoDashboard.tsx # Bento UI + Agent sidebar
│       │   └── IndiaGeoHeatmap.tsx         # SVG India map + threat corridors
│       └── data/
│           └── indiaGeoData.ts            # GeoJSON, cyber hubs, syndicate data
└── backend/
    ├── rust_core/                         # PyO3 Rust Extension
    │   └── src/lib.rs                     # Rust ingestion + PyO3 bindings
    ├── app/
    │   ├── main.py                        # FastAPI routes + WebSocket manager
    │   ├── graph_engine.py                # NetworkX graph wrapper (singleton)
    │   ├── agent/
    │   │   ├── investigator.py            # GPT-4o agentic loop
    │   │   └── tools.py                   # OpenAI Tool schemas
    │   └── models/
    │       ├── transaction.py             # Pydantic schemas
    │       └── investigation.py           # RingVerdict + InvestigationReport
    ├── scripts/
    │   ├── generate_data.py               # Synthetic data generator (Faker)
    │   └── evaluate.py                    # Evaluation runner
    ├── benchmarks/
    │   └── benchmark_ingestion.py         # Rust vs Python benchmark
    └── data/
        ├── accounts.json
        └── transactions.json
```

---

## 🏆 Why This Wins

| Capability | Mule Ring Sentinel | Traditional Fraud Tools |
|---|---|---|
| Detection Approach | Network-level GraphRAG | Single-transaction ML |
| Mule Ring Recall | ~100% (multi-hop graph traversal) | ~20-30% (context-blind) |
| Ingestion Speed | 2.1x (Rust Core) | Python baseline |
| Agent Reasoning | Autonomous, multi-step (GPT-4o) | Static rules / thresholds |
| Evidence Quality | Structured Pydantic verdict | Risk score only |
| Visualization | 5-syndicate topology + Geo-heatmap | Tables / dashboards |
| Real-time Feedback | WebSocket agent thought streaming | Batch reports |

---

## 👤 Author

**Bibek** — Razorpay AI Buildathon 2026, Track 2: Risk Manager

> Built to prove that AI can go beyond chatbots and actively dismantle financial crime at scale.
