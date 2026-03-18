from pydantic import BaseModel


class EvidenceItem(BaseModel):
    case_id: int
    evidence_type: str
    title: str
    description:str
    status:str #lifecycle of evidence item in your system
    source_kind: str # hoe the evidence entereed the system
    metadata_json:str # flexible structured extra data that depends on the evidence type.


class EvidenceItemCreate(BaseModel):
    case_id: int
    evidence_type: str
    title: str
    description:str
    source_kind: str # hoe the evidence entereed the system
    metadata_json:str # flexible structured extra data that depends