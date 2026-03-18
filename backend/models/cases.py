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

class CreateCase(BaseModel):
    case_number: str
    title: str
    description: Optional[str] = None
    org_id: int
    status: str = 'Open'
    priority: Optional[str] = None
    severity_level: Optional[str] = None
    due_date: Optional[str] = None

class UpdateCase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    severity_level: Optional[int] = None
    due_date: Optional[datetime] = None
    resolution: Optional[str] = None

class OrgCreateCase(BaseModel):
    title: str
    description: Optional[str] = None
    org_id: int
    created_by_user_id: int
    status: str = 'Open'
    priority: Optional[str] = None
    severity_level: Optional[str] = None
    due_date: Optional[str] = None

class CloseCase(BaseModel):
    case_id: int
    status: str
    resolution: str
    closed_by_user_id: int