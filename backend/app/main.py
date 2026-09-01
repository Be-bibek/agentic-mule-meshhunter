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

from .agent.investigator import MuleRingInvestigator

class InvestigationRequest(BaseModel):
    node_id: str

@app.post("/api/agent/investigate")
async def run_investigation(req: InvestigationRequest):
    investigator = MuleRingInvestigator()
    report = investigator.investigate(req.node_id)
    
    # Broadcast final verdict
    await manager.broadcast({
        "type": "investigation_complete",
        "target": req.node_id,
        "verdict": report.model_dump()
    })
    
    return report

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
