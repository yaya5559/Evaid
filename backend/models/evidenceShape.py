from pydantic import BaseModel
import uuid
import datetime


class EvidenceItemCreate(BaseModel):
    case_id: uuid.uuid4
    title: str
    created_by_user_id: int
    description:str


class EvidenceItemResponse:
    evidenceItem_id: uuid
    created_at: datetime
    message: str


class AttachementCreate(BaseModel):
    evidence_id: uuid.uuid4





