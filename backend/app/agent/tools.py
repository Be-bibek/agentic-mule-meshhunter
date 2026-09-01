from pydantic import BaseModel, Field
from typing import List

class GetNeighborsInput(BaseModel):
    node_id: str = Field(description="The ID of the account or device node to investigate.")
    depth: int = Field(default=1, description="How far to traverse. Default is 1.")

class DeviceOverlapInput(BaseModel):
    node_ids: List[str] = Field(description="List of account IDs to check for shared devices or IP addresses.")

class CircularFlowInput(BaseModel):
    node_id: str = Field(description="The ID of the account to trace for circular fund flows.")

class CentralityInput(BaseModel):
    node_ids: List[str] = Field(description="List of node IDs comprising the suspected subgraph to find the leader.")

GRAPH_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_neighbors",
            "description": "Get all accounts and devices immediately connected to a specific node.",
            "parameters": GetNeighborsInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_device_overlap",
            "description": "Check if a group of suspected accounts share the same physical devices or IP addresses (strong indicator of a mule ring).",
            "parameters": DeviceOverlapInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "trace_circular_flow",
            "description": "Trace transactions starting from a node to see if the funds eventually circle back to the same node.",
            "parameters": CircularFlowInput.model_json_schema()
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_centrality",
            "description": "Calculate centrality scores for a subgraph to identify the 'hub' or leader account orchestrating the ring.",
            "parameters": CentralityInput.model_json_schema()
        }
    }
]
