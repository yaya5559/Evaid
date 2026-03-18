
from fastapi import APIRouter, status, Depends
from models.GraphShape import GraphEdge
from services.graph_service import create_evidence_link
from pydantic import BaseModel, Field
from dependencies.auth import get_current_user
from uuid import UUID

<<<<<<< HEAD


=======
>>>>>>> 2ec97799 (remove node_modules from repo + graph and access system backend)
router = APIRouter(prefix="/graph")

class CreatEdgeModel(BaseModel):
    from_id: str
    to_id: str
    reason: str = Field(min_length=3, max_length=255)
    confidence: float |None =  Field(default=None, ge=0, le=1)

@router.get('/Graph/{caseID}')
async def getGraph(caseID: UUID):
    return caseID


