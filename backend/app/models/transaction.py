from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class DeviceInfo(BaseModel):
    device_id: str
    ip_address: str
    user_agent: str

class Transaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: datetime
    status: str = "success"
    device_info: DeviceInfo
    is_mule_ring: bool = False # Ground truth label (hidden from agent)
    ring_id: Optional[str] = None # Ground truth label (hidden from agent)

class Account(BaseModel):
    account_id: str
    name: str
    created_at: datetime
    is_mule: bool = False # Ground truth label (hidden from agent)
    ring_id: Optional[str] = None # Ground truth label (hidden from agent)
