from fastapi import APIRouter
from pydantic import BaseModel
import services.org_admin.org_note_services as services

router = APIRouter(prefix="/org/notes", tags=["Org Admin - Notes"])


class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


@router.get("/case/{case_id}")
def list_case_notes(case_id: int, org_id: int):
    return services.list_case_notes(case_id, org_id)


@router.post("/case/{case_id}")
def create_case_note(case_id: int, org_id: int, created_by_user_id: int, data: NoteCreate):
    return services.create_case_note(case_id, org_id, created_by_user_id, data.content)


@router.patch("/{note_id}")
def update_note(note_id: int, org_id: int, data: NoteUpdate):
    return services.update_note(note_id, org_id, data.content)


@router.delete("/{note_id}")
def delete_note(note_id: int, org_id: int):
    return services.delete_note(note_id, org_id)

