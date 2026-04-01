from fastapi import APIRouter
from models.cases import AgentCreateCase
import services.agent.agent_case_services as services

router = APIRouter(prefix="/agent/cases", tags=["Agent - Cases"])


@router.get("/")
def list_my_cases(agent_id: int, org_id: int):
    return services.list_my_cases(agent_id, org_id)


@router.post("/")
def create_case(agent_id: int, org_id: int, data: AgentCreateCase):
    return services.create_case(org_id, agent_id, data.title, data.description, data.priority, data.severity_level, data.due_date)


@router.get("/{case_id}")
def get_my_case(case_id: int, agent_id: int, org_id: int):
    return services.get_my_case(case_id, agent_id, org_id)


@router.patch("/{case_id}")
def update_my_case(case_id: int, agent_id: int, org_id: int, title: str = None, due_date: str = None):
    return services.update_my_case(case_id, agent_id, org_id, title, due_date)

