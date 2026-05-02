from fastapi import APIRouter, Depends
from dependencies.auth import get_current_user
import services.agent.agent_dashboard_services as services

router = APIRouter(prefix="/agent/dashboard", tags=["Agent - Dashboard"])


@router.get("/summary")
def get_dashboard_summary(current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id   = current_user.get("claims", {}).get("org_id")
    return services.get_dashboard_summary(agent_id, org_id)


@router.get("/stats")
def get_agent_stats(current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id   = current_user.get("claims", {}).get("org_id")
    return services.get_agent_stats(agent_id, org_id)


@router.get("/activity")
def get_agent_activity(current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id   = current_user.get("claims", {}).get("org_id")
    return services.get_agent_activity(agent_id, org_id)


@router.get("/assignments")
def get_agent_assignments(current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id   = current_user.get("claims", {}).get("org_id")
    return services.get_agent_assignments(agent_id, org_id)
