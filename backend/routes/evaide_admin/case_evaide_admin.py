from fastapi import APIRouter
from models.cases import CreateCase, UpdateCase, CloseCase
import services.evaide_admin.admin_case_services as services

router = APIRouter(prefix="/admin/cases", tags=["Evaide Admin - Cases"])


@router.get("/")
def list_all_cases():
    return services.list_all_cases()


@router.get("/org/{org_id}")
def list_org_cases(org_id: int):
    return services.list_org_cases(org_id)


@router.get("/org/{org_id}/agents")
def get_org_agents(org_id: int):
    return services.get_org_agents(org_id)


@router.get("/org/{org_id}/{case_id}")
def get_case_detail(case_id: int):
    return services.get_case_detail(case_id)


@router.post("/org/{org_id}/create_case")
def create_case(data: CreateCase, user_id: int):
    return services.create_case(data, user_id)


@router.patch("/org/{org_id}/update/{case_id}")
def update_case(case_id: int, data: UpdateCase):
    return services.update_case(case_id, data)


@router.patch("/org/{org_id}/{case_id}/close")
def close_case(data: CloseCase):
    return services.close_case(data)


@router.delete("/org/{org_id}/{case_id}/delete")
def delete_case(case_id: int, user_id: int):
    return services.delete_case(case_id, user_id)


@router.post("/org/{org_id}/{case_id}/assign")
def assign_agent(case_id: int, user_id: int, assigned_by: int):
    return services.assign_agent(case_id, user_id, assigned_by)
