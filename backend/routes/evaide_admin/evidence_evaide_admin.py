from fastapi import APIRouter
import services.evaide_admin.admin_evidence_services as services

router = APIRouter(prefix="/admin/evidence", tags=["Evaide Admin - Evidence"])


@router.get("/")
def list_all_evidence():
    return services.list_all_evidence()


@router.get("/case/{case_id}")
def list_case_evidence(case_id: int):
    return services.list_case_evidence(case_id)


@router.get("/file/{file_id}")
def get_evidence_file(file_id: str):
    return services.get_evidence(file_id)  


@router.delete("/{file_id}")
def delete_evidence(file_id: str):
    return services.delete_evidence(file_id)
