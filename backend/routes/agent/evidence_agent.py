<<<<<<< HEAD
﻿from fastapi import APIRouter
=======
from fastapi import APIRouter
>>>>>>> origin/main
import services.agent.agent_evidence_services as services

router = APIRouter(prefix="/agent/evidence", tags=["Agent - Evidence"])


@router.get("/")
def list_my_evidence(agent_id: int):
    return services.list_my_evidence(agent_id)


@router.get("/case/{case_id}")
def list_case_evidence(case_id: int, agent_id: int):
    return services.list_case_evidence(case_id, agent_id)


@router.get("/file/{file_id}")
def get_evidence_file(file_id: str, agent_id: int):
    return services.get_evidence_file(file_id, agent_id)


@router.patch("/confirm/{file_id}")
def confirm_evidence(file_id: str, agent_id: int):
    return services.confirm_evidence(file_id, agent_id)


@router.delete("/cancel/{file_id}")
def cancel_evidence(file_id: str, agent_id: int):
    return services.cancel_evidence(file_id, agent_id)


@router.delete("/{file_id}")
def delete_my_evidence(file_id: str, agent_id: int):
    return services.delete_my_evidence(file_id, agent_id)
<<<<<<< HEAD

=======
>>>>>>> origin/main
