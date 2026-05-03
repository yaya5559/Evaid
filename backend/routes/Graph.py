from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from dependencies.auth import get_current_user
from services.graph_service import get_case_graph
from uuid import UUID


router = APIRouter(prefix="/graph")

class CreateEdgeModel(BaseModel):
    from_id: str
    to_id: str
    reason: str = Field(min_length=3, max_length=255)
    confidence: float | None = Field(default=None, ge=0, le=1)


@router.get('/cases/{caseId}')
async def getGraph(caseId: UUID, current_user=Depends(get_current_user)):
    return get_case_graph(caseId)
