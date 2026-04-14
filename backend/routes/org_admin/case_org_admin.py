from fastapi import APIRouter, Depends, HTTPException
from models.cases import OrgCreateCase, CloseCase
from dependencies.auth import get_current_user, verify_dynamic_access, require_roles
import services.org_admin.org_case_services as services
import services.org_admin.org_assignment_services as assignment_services

router = APIRouter(prefix="/org/cases", tags=["Org Admin - Cases"])


@router.get("/")
def list_org_cases(current_user=Depends(get_current_user)):
    org_id = current_user.get("claims", {}).get("org_id")
    return services.list_org_cases(org_id)

@router.get("/agents/", dependencies=[Depends(require_roles("org_admin", "evaide_admin"))])
def list_org_agents(current_user=Depends(get_current_user)):
    """All active agents in the org - used to populate the assign-agent dropdown."""
    org_id = current_user.get("claims", {}).get("org_id")
    return assignment_services.list_org_agents(org_id)

@router.get("/{case_id}")
def get_org_case(case_id: int, current_user=Depends(get_current_user)):
    if not verify_dynamic_access(case_id, current_user):
        raise HTTPException(
            status_code=403,
            detail="Access denied: No organizational or AI link found"
        )
    org_id = current_user.get("claims", {}).get("org_id")
    return services.get_org_case(case_id, org_id)


@router.post("/")
def create_case(data: OrgCreateCase, current_user=Depends(get_current_user)):
    org_id = current_user.get("claims", {}).get("org_id")
    return services.create_case(org_id, data)


@router.patch("/close/{case_id}")
def close_org_case(case_id: int, resolution: str, current_user=Depends(get_current_user)):
    org_id = current_user.get("claims", {}).get("org_id")
    closed_by_user_id = current_user.get("user_id")
    return services.close_org_case(case_id, org_id, closed_by_user_id, resolution)


@router.patch("/{case_id}")
def update_org_case(
    case_id: int,
    description: str = None,
    priority: str = None,
    severity_level: str = None,
    due_date: str = None,
    current_user=Depends(get_current_user)
):
    org_id = current_user.get("claims", {}).get("org_id")
    return services.update_org_case(
        case_id, org_id, description, priority, severity_level, due_date
    )


@router.delete("/{case_id}")
def delete_org_case(case_id: int, current_user=Depends(get_current_user)):
    org_id = current_user.get("claims", {}).get("org_id")
    return services.delete_org_case(case_id, org_id)

@router.get("/{case_id}/assignments", dependencies=[Depends(require_roles("org_admin", "evaide_admin"))])
def list_case_assignments(case_id: int, current_user=Depends(get_current_user)):
    """All agents currently assigned to a case."""
    org_id = current_user.get("claims", {}).get("org_id")
    return assignment_services.list_case_assignments(case_id, org_id)


@router.post("/{case_id}/assignments/{user_id}", dependencies=[Depends(require_roles("org_admin", "evaide_admin"))])
def assign_agent(case_id: int, user_id: int, current_user=Depends(get_current_user)):
    """Assigns an agent to a case."""
    org_id = current_user.get("claims", {}).get("org_id")
    assigned_by = current_user.get("user_id")
    return assignment_services.assign_agent_to_case(case_id, user_id, assigned_by, org_id)


@router.delete("/{case_id}/assignments/{user_id}", dependencies=[Depends(require_roles("org_admin", "evaide_admin"))])
def unassign_agent(case_id: int, user_id: int, current_user=Depends(get_current_user)):
    """Removes an agent from a case."""
    org_id = current_user.get("claims", {}).get("org_id")
    return assignment_services.remove_agent_from_case(case_id, user_id, org_id)
