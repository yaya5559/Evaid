from fastapi import APIRouter
import services.org_admin.org_evidence_services as services

router = APIRouter(prefix="/org/evidence", tags=["Org Admin - Evidence"])


@router.get("/")
def list_org_evidence(org_id: int):
    return services.list_org_evidence(org_id)


@router.get("/case/{case_id}")
def list_case_evidence(case_id: int, org_id: int):
    return services.list_case_evidence(case_id, org_id)


@router.get("/file/{file_id}")
def get_evidence_file(file_id: str, org_id: int):
    return services.get_evidence_file(file_id, org_id)


@router.delete("/{file_id}")
def delete_evidence(file_id: str, org_id: int):
    return services.delete_evidence(file_id, org_id)
