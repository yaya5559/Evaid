from fastapi import HTTPException, status, APIRouter
from models.cases import Case
import backend.services.evaide_admin.admin_case_services as services

router = APIRouter(prefix="/Cases", tags=["Cases"])

@router.get("/list_all_cases")
def all_cases():
  return services.list_all_cases()