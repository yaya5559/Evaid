from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import get_current_user
import services.org_admin.org_assignment_services as services

router = APIRouter(prefix="/org/assignments", tags=["Org Admin - Assignments"])


@router.get("/case/{case_id}")
def list_case_assignments(case_id: int, current_user=Depends(get_current_user)):
    org_id = current_user.get("claims", {}).get("org_id") 
    return services.list_case_assignments(case_id, org_id)


@router.post("/case/{case_id}")
def assign_agent_to_case(case_id: int, user_id: int, current_user=Depends(get_current_user)):
    org_id = current_user.get("claims", {}).get("org_id")
    assigned_by = current_user.get("user_id")
    
    return services.assign_agent_to_case(case_id, user_id, assigned_by, org_id)


@router.delete("/case/{case_id}/agent/{user_id}")
def remove_agent_from_case(case_id: int, user_id: int, current_user=Depends(get_current_user)):
    if current_user.get("role") not in ["evaide_admin", "org_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    org_id = current_user.get("claims", {}).get("org_id")
    return services.remove_agent_from_case(case_id, user_id, org_id)
