<<<<<<< HEAD
﻿from fastapi import APIRouter
=======
from fastapi import APIRouter
>>>>>>> origin/main
import services.org_admin.org_user_services as services

router = APIRouter(prefix="/org/agents", tags=["Org Admin - Agents"])


@router.get("/")
def list_org_agents(org_id: int):
    return services.list_org_agents(org_id)


@router.get("/{user_id}")
def get_org_agent(user_id: int, org_id: int):
    return services.get_org_agent(user_id, org_id)


@router.patch("/enable/{user_id}")
def enable_org_agent(user_id: int, org_id: int):
    return services.enable_org_agent(user_id, org_id)


@router.patch("/disable/{user_id}")
def disable_org_agent(user_id: int, org_id: int):
    return services.disable_org_agent(user_id, org_id)
<<<<<<< HEAD

=======
>>>>>>> origin/main
