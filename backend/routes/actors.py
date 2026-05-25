from fastapi import APIRouter, Depends
from dependencies.auth import get_current_user
import services.actor_service as services

router = APIRouter(prefix="/actors", tags=["Actors"], dependencies=[Depends(get_current_user)])


@router.get("/case/{case_id}")
def list_actors(case_id: int):
    return services.list_actors_for_case(case_id)

@router.post("/case/{case_id}")
def create_actor(case_id: int, data: dict, user: dict = Depends(get_current_user)):
    return services.create_actor(
        case_id=case_id,
        name=data["name"],
        role=data.get("role", "Person of Interest"),
        source="User",
    )


@router.get("/{actor_id}")
def get_actor(actor_id: str):
    return services.get_actor_detail(actor_id)


@router.post("/{actor_id}/aliases")
def add_alias(actor_id: str, data: dict):
    return services.add_alias(actor_id, data["alias"])


@router.post("/{actor_id}/notes")
def add_note(actor_id: str, data: dict, user: dict = Depends(get_current_user)):
    user_id = user.get("user_id")
    return services.add_note(actor_id, data["content"], user_id)