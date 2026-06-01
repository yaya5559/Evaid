from fastapi import APIRouter, Depends
from pydantic import BaseModel
import services.agent.agent_note_services as services
from dependencies.auth import require_roles, get_current_user

router = APIRouter(
    prefix="/agent/notes",
    tags=["Agent - Notes"],
    dependencies=[Depends(require_roles("agent", "org_admin", "evaide_admin"))],
)


class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


@router.get("/case/{case_id}")
def list_case_notes(case_id: int, user: dict = Depends(get_current_user)):
    return services.list_case_notes(case_id, user["user_id"])


@router.post("/case/{case_id}")
def create_case_note(case_id: int, data: NoteCreate, user: dict = Depends(get_current_user)):
    return services.create_case_note(case_id, user["user_id"], data.content)


@router.patch("/{note_id}")
def update_my_note(note_id: int, data: NoteUpdate, user: dict = Depends(get_current_user)):
    return services.update_my_note(note_id, user["user_id"], data.content)


@router.delete("/{note_id}")
def delete_my_note(note_id: int, user: dict = Depends(get_current_user)):
    return services.delete_my_note(note_id, user["user_id"])
