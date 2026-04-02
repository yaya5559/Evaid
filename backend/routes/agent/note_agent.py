<<<<<<< HEAD
﻿from fastapi import APIRouter
=======
from fastapi import APIRouter
>>>>>>> origin/main
from pydantic import BaseModel
import services.agent.agent_note_services as services

router = APIRouter(prefix="/agent/notes", tags=["Agent - Notes"])


class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


@router.get("/case/{case_id}")
def list_case_notes(case_id: int, agent_id: int):
    return services.list_case_notes(case_id, agent_id)


@router.post("/case/{case_id}")
def create_case_note(case_id: int, agent_id: int, data: NoteCreate):
    return services.create_case_note(case_id, agent_id, data.content)


@router.patch("/{note_id}")
def update_my_note(note_id: int, agent_id: int, data: NoteUpdate):
    return services.update_my_note(note_id, agent_id, data.content)
<<<<<<< HEAD

=======
>>>>>>> origin/main
