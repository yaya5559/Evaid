from fastapi import APIRouter
from models.cases import Case, UpdateCase, CloseCase
import services.evaide_admin.admin_case_services as services

router = APIRouter(prefix="/admin/cases", tags=["Evaide Admin - Cases"])


@router.get("/")
def list_all_cases():
    return services.list_all_cases()


@router.get("/org/{org_id}")
def list_org_cases(org_id: int):
    return services.list_org_cases(org_id)


@router.get("/{case_id}")
def get_case_detail(case_id: int):
    return services.get_case_detail(case_id)


@router.post("/")
def create_case(data: Case, user_id: int):
    return services.create_case(data, user_id)


@router.patch("/{case_id}")
def update_case(case_id: int, data: UpdateCase):
    return services.update_case(case_id, data)


@router.patch("/close")
def close_case(data: CloseCase):
    return services.close_case(data)


@router.delete("/{case_id}")
def delete_case(case_id: int, user_id: int):
    return services.delete_case(case_id, user_id)
