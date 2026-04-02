from fastapi import APIRouter, status, Depends
from models.GraphShape import GraphEdge
from services.graph_service import create_evidence_link
from pydantic import BaseModel, Field
from dependencies.auth import get_current_user
from uuid import UUID



router = APIRouter(prefix="/graph")

class CreatEdgeModel(BaseModel):
    from_id: str
    to_id: str
    reason: str = Field(min_length=3, max_length=255)
    confidence: float |None =  Field(default=None, ge=0, le=1)

@router.get('/Graph/{caseID}')
async def getGraph(caseID: UUID):
    return caseID



@router.post('/cases/{case_id}/edges', status_code=status.HTTP_201_CREATED)
async def addEdge(case_id: UUID, body:CreatEdgeModel, user= Depends(get_current_user)):
    return create_evidence_link(
        case_id=case_id,
        from_id=body.from_id,
        to_id=body.to_id,
        reason=body.reason,
        confidence=body.confidence,
        created_by=user.get("user_id"),            
    )

