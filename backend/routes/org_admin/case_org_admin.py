from fastapi import APIRouter
from models.cases import OrgCreateCase, CloseCase
import services.org_admin.org_case_services as services

router = APIRouter(prefix="/org/cases", tags=["Org Admin - Cases"])


@router.get("/")
def list_org_cases(org_id: int):
    return services.list_org_cases(org_id)


@router.get("/{case_id}")
def get_org_case(case_id: int, org_id: int):
    return services.get_org_case(case_id, org_id)


@router.post("/")
def create_case(org_id: int, data: OrgCreateCase):
    return services.create_case(org_id, data)


@router.patch("/close/{case_id}")
def close_org_case(case_id: int, org_id: int, closed_by_user_id: int, resolution: str):
    return services.close_org_case(case_id, org_id, closed_by_user_id, resolution)


@router.patch("/{case_id}")
def update_org_case(case_id: int, org_id: int, description: str = None, priority: str = None, severity_level: str = None, due_date: str = None):
    return services.update_org_case(case_id, org_id, description, priority, severity_level, due_date)


@router.delete("/{case_id}")
def delete_org_case(case_id: int, org_id: int):
    return services.delete_org_case(case_id, org_id)

