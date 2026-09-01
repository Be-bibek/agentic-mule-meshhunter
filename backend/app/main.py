from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from pydantic import BaseModel
import asyncio
import json

from .graph_engine import get_graph_engine

app = FastAPI(title="Agentic Mule-Ring Hunter API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# Agent API

from fastapi import BackgroundTasks
from .agent.investigator import MuleRingInvestigator

class InvestigationRequest(BaseModel):
    node_id: str

import asyncio
from concurrent.futures import ThreadPoolExecutor

_thread_pool = ThreadPoolExecutor(max_workers=4)

async def _run_investigation_task(node_id: str):
    """Background task: runs the CPU-bound agent in a thread pool, broadcasts over WebSocket."""
    await manager.broadcast({
        "type": "investigation_started",
        "target": node_id,
        "message": f"Agent dispatched to investigate {node_id}"
    })
    investigator = MuleRingInvestigator()
    loop = asyncio.get_event_loop()
    # Run the blocking graph traversal + LLM loop in a thread to not block the event loop
    report = await loop.run_in_executor(_thread_pool, investigator.investigate, node_id)
    await manager.broadcast({
        "type": "investigation_complete",
        "target": node_id,
        "verdict": report.model_dump()
    })

@app.post("/api/agent/investigate", status_code=202)
async def run_investigation(req: InvestigationRequest, background_tasks: BackgroundTasks):
    """
    Fire-and-forget investigation endpoint.
    Returns 202 Accepted immediately (<10ms); results stream via WebSocket.
    The CPU-bound agent runs in a thread pool to avoid blocking the event loop.
    """
    background_tasks.add_task(_run_investigation_task, req.node_id)
    return {"status": "accepted", "target": req.node_id, "message": "Investigation dispatched. Subscribe to WebSocket for live results."}


# Graph API Endpoints for the Agent

class NodeList(BaseModel):
    node_ids: List[str]

@app.get("/api/investigate/neighbors/{node_id}")
async def get_neighbors(node_id: str, depth: int = 1):
    engine = get_graph_engine()
    result = engine.get_neighbors(node_id, depth)
    
    # Broadcast the agent's action to the frontend
    await manager.broadcast({
        "type": "agent_action",
        "action": "get_neighbors",
        "target": node_id,
        "result_size": len(result.get("neighbors", [])) if "neighbors" in result else 0
    })
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.post("/api/investigate/device_overlap")
async def check_device_overlap(req: NodeList):
    engine = get_graph_engine()
    result = engine.check_device_overlap(req.node_ids)
    
    await manager.broadcast({
        "type": "agent_action",
        "action": "check_device_overlap",
        "target": f"{len(req.node_ids)} nodes",
        "result_size": result.get("shared_devices_found", 0)
    })
    
    return result

@app.get("/api/investigate/circular_flow/{node_id}")
async def trace_circular_flow(node_id: str):
    engine = get_graph_engine()
    result = engine.trace_circular_flow(node_id)
    
    await manager.broadcast({
        "type": "agent_action",
        "action": "trace_circular_flow",
        "target": node_id,
        "result_size": result.get("circular_flows_found", 0) if "circular_flows_found" in result else 0
    })
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.post("/api/investigate/centrality")
async def calculate_centrality(req: NodeList):
    engine = get_graph_engine()
    result = engine.calculate_centrality(req.node_ids)
    
    await manager.broadcast({
        "type": "agent_action",
        "action": "calculate_centrality",
        "target": f"{len(req.node_ids)} nodes"
    })
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# Graph Data Serving Endpoints (for frontend visualization)
import os as _os, json as _json

@app.get("/api/graph/accounts")
async def get_accounts_data():
    """Serve the accounts JSON for the frontend graph visualization."""
    data_path = _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), "data", "accounts.json")
    with open(data_path, "r") as f:
        return _json.load(f)

@app.get("/api/graph/transactions")
async def get_transactions_data():
    """Serve the transactions JSON for the frontend graph visualization."""
    data_path = _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), "data", "transactions.json")
    with open(data_path, "r") as f:
        return _json.load(f)

# WebSocket endpoint for real-time visualization
@app.websocket("/api/ws/investigation")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client right now, just keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

