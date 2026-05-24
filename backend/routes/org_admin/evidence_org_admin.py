from fastapi import APIRouter, Depends, Response
from dependencies.auth import get_current_user
from services.database import get_db_connection
import services.org_admin.org_evidence_services as services

router = APIRouter(prefix="/org/evidence", tags=["Org Admin - Evidence"])


@router.get("/preview/{evidence_item_id}")
def preview_evidence(evidence_item_id: str, current_user=Depends(get_current_user)):
    """Returns raw file bytes for preview."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT a.file_bytes, a.attachment_kind, ei.title
            FROM Attachment a
            JOIN EvidenceItem ei ON ei.Id = a.evidence_id
            WHERE CAST(ei.Id AS NVARCHAR(36)) = ?
        """, (evidence_item_id.upper(),))
        row = cursor.fetchone()
        if not row:
            return Response(status_code=404)
        file_bytes, content_type, title = row
        return Response(
            content=bytes(file_bytes),
            media_type=content_type or "application/octet-stream",
            headers={"Content-Disposition": f'inline; filename="{title}"'}
        )
    finally:
        conn.close()


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
