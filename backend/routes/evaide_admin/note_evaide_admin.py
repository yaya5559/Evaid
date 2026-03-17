from fastapi import APIRouter
import services.evaide_admin.admin_note_services as services

router = APIRouter(prefix="/admin/notes", tags=["Evaide Admin - Notes"])


@router.get("/")
def list_all_notes():
    return services.list_all_notes()


@router.get("/case/{case_id}")
def list_case_notes(case_id: int):
    return services.list_case_notes(case_id)


@router.delete("/{note_id}")
def delete_note(note_id: int):
    return services.delete_note(note_id)
