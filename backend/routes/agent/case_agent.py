from fastapi import APIRouter
from models.cases import Case
import services.agent.agent_case_services as services

router = APIRouter(prefix="/agent/cases", tags=["Agent - Cases"])


@router.get("/")
def list_my_cases(agent_id: int):
    return services.list_my_cases(agent_id)


@router.get("/{case_id}")
def get_my_case(case_id: int, agent_id: int):
    return services.get_my_case(case_id, agent_id)


@router.post("/")
def create_case(data: Case, user_id: int):
    return services.create_case(data, user_id)
