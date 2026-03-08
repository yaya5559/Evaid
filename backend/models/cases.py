from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Case(BaseModel):
    case_id: int
    case_number: str  
    title: str
    description: Optional[str]
    created_at: datetime
    org_id: int
    created_by_user_id: int
    status: str
    priority: Optional[str]
    severity_level: Optional[int]
    due_date: Optional[datetime]
    closed_at: Optional[datetime]
    resolution: Optional[str]
    closed_by_user_id: Optional[int]
