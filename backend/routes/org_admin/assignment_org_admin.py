from fastapi import APIRouter
import services.org_admin.org_assignment_services as services

router = APIRouter(prefix="/org/assignments", tags=["Org Admin - Assignments"])


@router.get("/case/{case_id}")
def list_case_assignments(case_id: int, org_id: int):
    return services.list_case_assignments(case_id, org_id)


@router.post("/case/{case_id}")
def assign_agent_to_case(case_id: int, user_id: int, assigned_by: int, org_id: int):
    return services.assign_agent_to_case(case_id, user_id, assigned_by, org_id)


@router.delete("/case/{case_id}/agent/{user_id}")
def remove_agent_from_case(case_id: int, user_id: int, org_id: int):
    return services.remove_agent_from_case(case_id, user_id, org_id)
