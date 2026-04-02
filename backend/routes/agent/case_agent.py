from fastapi import APIRouter, Depends
from models.cases import AgentCreateCase
from dependencies.auth import get_current_user
import services.agent.agent_case_services as services

router = APIRouter(prefix="/agent/cases", tags=["Agent - Cases"])


@router.get("/")
def list_my_cases(current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
    return services.list_my_cases(agent_id, org_id)


@router.post("/")
def create_case(data: AgentCreateCase, current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
    return services.create_case(org_id, agent_id, data.title, data.description, data.priority, data.severity_level, data.due_date)


@router.get("/{case_id}")
def get_my_case(case_id: int, current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
    return services.get_my_case(case_id, agent_id, org_id)


@router.patch("/{case_id}")
def update_my_case(case_id: int, title: str = None, due_date: str = None, current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
    return services.update_my_case(case_id, agent_id, org_id, title, due_date)
