<<<<<<< HEAD
﻿from fastapi import APIRouter
=======
from fastapi import APIRouter
>>>>>>> origin/main
from pydantic import BaseModel
import services.evaide_admin.admin_case_notes_services as services

router = APIRouter(prefix="/admin/notes", tags=["Evaide Admin - Notes"])


class CreateNoteBody(BaseModel):
    content: str


@router.get("/case/{case_id}")
def list_case_notes(case_id: int):
    return services.list_case_notes(case_id)


@router.post("/case/{case_id}")
def create_note(case_id: int, user_id: int, data: CreateNoteBody):
    return services.create_note(case_id, data.content, user_id)


@router.patch("/{note_id}")
def update_note(note_id: int, data: CreateNoteBody):
    return services.update_note(note_id, data.content)


@router.delete("/{note_id}")
def delete_note(note_id: int):
    return services.delete_note(note_id)
<<<<<<< HEAD

=======
>>>>>>> origin/main
