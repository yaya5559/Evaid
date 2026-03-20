from pydantic import BaseModel
from uuid import UUID
import datetime


class EvidenceItemCreate(BaseModel):
    case_id: UUID
    title: str
    description:str


class EvidenceItemResponse(BaseModel):
    evidenceItem_id: UUID
    created_at: datetime.datetime
    status: str
    message: str


class AttachementCreate(BaseModel):
    evidence_id: UUID

class AttachmentUploadResponse(BaseModel):
    attachment_id: UUID
    analysis_run_id: UUID
    checksum_sha256: str
    size_bytes: int
    status: str





