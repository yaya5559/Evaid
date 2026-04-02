<<<<<<< HEAD
﻿from fastapi import APIRouter
from models.cases import AgentCreateCase
=======
from fastapi import APIRouter, Depends
from models.cases import AgentCreateCase
from dependencies.auth import get_current_user
>>>>>>> origin/main
import services.agent.agent_case_services as services

router = APIRouter(prefix="/agent/cases", tags=["Agent - Cases"])


@router.get("/")
<<<<<<< HEAD
def list_my_cases(agent_id: int, org_id: int):
=======
def list_my_cases(current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
>>>>>>> origin/main
    return services.list_my_cases(agent_id, org_id)


@router.post("/")
<<<<<<< HEAD
def create_case(agent_id: int, org_id: int, data: AgentCreateCase):
=======
def create_case(data: AgentCreateCase, current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
>>>>>>> origin/main
    return services.create_case(org_id, agent_id, data.title, data.description, data.priority, data.severity_level, data.due_date)


@router.get("/{case_id}")
<<<<<<< HEAD
def get_my_case(case_id: int, agent_id: int, org_id: int):
=======
def get_my_case(case_id: int, current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
>>>>>>> origin/main
    return services.get_my_case(case_id, agent_id, org_id)


@router.patch("/{case_id}")
<<<<<<< HEAD
def update_my_case(case_id: int, agent_id: int, org_id: int, title: str = None, due_date: str = None):
    return services.update_my_case(case_id, agent_id, org_id, title, due_date)

=======
def update_my_case(case_id: int, title: str = None, due_date: str = None, current_user=Depends(get_current_user)):
    agent_id = current_user.get("user_id")
    org_id = current_user.get("claims", {}).get("org_id")
    return services.update_my_case(case_id, agent_id, org_id, title, due_date)
>>>>>>> origin/main
