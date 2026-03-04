from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class EvidenceDetail(BaseModel):
    id: int
    fileName: str
    uploadDate: datetime
    ocrText: Optional[str] = None
    entities: List[str] = []
    summary: Optional[str] = None
