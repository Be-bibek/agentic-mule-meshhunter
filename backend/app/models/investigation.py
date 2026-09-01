from typing import List, Dict, Any
from pydantic import BaseModel

class EvidenceNode(BaseModel):
    node_id: str
    node_type: str # "account", "device", "transaction"
    reason: str # Why was this included in the evidence?

class RingVerdict(BaseModel):
    is_mule_ring: bool
    confidence_score: float # 0.0 to 1.0
    ring_members: List[str] # List of account IDs
    evidence: List[EvidenceNode]
    summary: str # Text summary of how the ring operates

class InvestigationReport(BaseModel):
    investigation_id: str
    target_node_id: str
    verdict: RingVerdict
    tools_used: List[str]
    time_taken_ms: int
