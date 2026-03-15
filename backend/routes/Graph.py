from fastapi import APIRouter
from ..models.GraphShape import GraphEdge


router = APIRouter(prefix="/graph")

@router.get('/Graph/{caseID}')
async def getGraph(caseID: int):
    return caseID



@router.post('/cases/{case_id}/edges')
async def addEdge(case_id: int, edge: GraphEdge):
    
