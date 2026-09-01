# Agentic Mule-Ring Hunter

Built for the **Razorpay AI Buildathon 2026** (Track 2: AI Risk Manager).

## The Problem
Standard ML models predict single-transaction failure or fraud. But organized fraud operates in networks (Mule Rings), where seemingly unrelated accounts share IPs/devices and trade funds in circular flows to wash money. Rule engines and XGBoost cannot natively traverse and reason about complex graphs.

## The Solution
An autonomous AI Agent (The Abuse-Ring Sentinel) equipped with graph database tools. It dynamically queries a NetworkX graph, "walks" the transaction network, identifies shared device overlaps, detects circular fund flows, and compiles a structured evidence package proving the existence of a mule ring.

## Architecture
- **Data Engine**: Synthetic generation of 1,000 normal transactions + 3 hidden mule rings with complex bipartite structures (Users ↔ Devices).
- **Graph Backend**: `NetworkX` exposed via FastAPI tool-endpoints.
- **Agent Orchestrator**: GPT-4o orchestrated loop that calls graph tools autonomously.
- **Frontend**: React + ForceGraph2D + WebSockets for real-time visualization of the agent's thought process.

## How to Run

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/generate_data.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Evaluation
```bash
cd backend
python scripts/evaluate.py
```
