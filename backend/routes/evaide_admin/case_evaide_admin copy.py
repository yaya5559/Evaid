from fastapi import APIRouter
from models.cases import UpdateCase, CloseCase
import backend.services.evaide_admin.admin_case_services as services

router = APIRouter(prefix="/Cases_Evaide_admin", tags=["Cases_Evaide_Admin"])

@router.get("/list_all_cases")
def all_cases():
  return services.list_all_cases()

@router.get("/list_org_cases")
def org_cases(org: int):
  return services.list_org_cases(org)

@router.get("/case_details")
def case_details(case_id: int):
  return services.get_case_detail(case_id)

@router.patch("/update_case")
def update_case(case_id: int, data: UpdateCase):
  return services.update_case(case_id, data)

@router.patch("/close_case")
def close_case(data: CloseCase):
  return services.close_case(data)

@router.patch("/delete_case")
def delete_case(case_id: int, user: int):
  return services.delete_case(case_id, user)