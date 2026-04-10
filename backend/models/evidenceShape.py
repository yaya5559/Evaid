from pydantic import BaseModel
from uuid import UUID
import datetime
from typing import Optional


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


class ExtractorInput(BaseModel):
    attachment_id: UUID
    attachment_kind: str
    file_bytes: bytes

class ExtractedSignal(BaseModel):
    signal_type: str
    raw_value: str
    normalized_value: Optional[str] = None
    confidence: float
    source_locator: dict




