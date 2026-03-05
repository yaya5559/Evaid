from fastapi import HTTPException, status, APIRouter
from models.cases import Case
import services.caseServices as services

router = APIRouter(prefix="/Cases", tags=["Cases"])

@router.get("/list_all_cases")
def all_cases():
  return services.list_all_cases()