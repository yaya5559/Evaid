from fastapi import APIRouter, Depends, Response
from dependencies.auth import get_current_user, require_roles
from services.database import get_db_connection
import services.agent.agent_evidence_services as services

router = APIRouter(
    prefix="/agent/evidence",
    tags=["Agent - Evidence"],
    dependencies=[Depends(require_roles("agent", "org_admin", "evaide_admin"))],
)


@router.get("/")
def list_my_evidence(user: dict = Depends(get_current_user)):
    return services.list_my_evidence(user["user_id"])


@router.get("/case/{case_id}")
def list_case_evidence(case_id: int, user: dict = Depends(get_current_user)):
    return services.list_case_evidence(case_id, user["user_id"])


@router.get("/file/{file_id}")
def get_evidence_file(file_id: str, user: dict = Depends(get_current_user)):
    return services.get_evidence_file(file_id, user["user_id"])


# IMPORTANT: /preview must come before /{evidence_item_id} to avoid route conflict
@router.get("/preview/{evidence_item_id}")
def preview_evidence(evidence_item_id: str, current_user=Depends(get_current_user)):
    """Returns the raw file bytes for an EvidenceItem so the frontend can preview it."""
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


@router.patch("/confirm/{file_id}")
def confirm_evidence(file_id: str, user: dict = Depends(get_current_user)):
    return services.confirm_evidence(file_id, user["user_id"])


@router.delete("/cancel/{file_id}")
def cancel_evidence(file_id: str, user: dict = Depends(get_current_user)):
    return services.cancel_evidence(file_id, user["user_id"])


@router.delete("/{evidence_item_id}")
def delete_my_evidence(evidence_item_id: str, current_user=Depends(get_current_user)):
    """Deletes an EvidenceItem and its attachments."""
    agent_id = current_user.get("user_id")
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT 1 FROM EvidenceItem WHERE CAST(Id AS NVARCHAR(36)) = ? AND created_by_user_id = ?",
            (evidence_item_id.upper(), agent_id)
        )
        if cursor.fetchone() is None:
            return {"message": "Evidence not found or access denied"}

        cursor.execute("DELETE FROM Signal WHERE CAST(evidence_id AS NVARCHAR(36)) = ?", (evidence_item_id.upper(),))
        cursor.execute("DELETE FROM PendingSignal WHERE CAST(evidence_id AS NVARCHAR(36)) = ?", (evidence_item_id.upper(),))
        cursor.execute("DELETE FROM AnalysisRun WHERE CAST(evidence_id AS NVARCHAR(36)) = ?", (evidence_item_id.upper(),))
        cursor.execute("DELETE FROM Attachment WHERE CAST(evidence_id AS NVARCHAR(36)) = ?", (evidence_item_id.upper(),))
        cursor.execute("DELETE FROM EvidenceItem WHERE CAST(Id AS NVARCHAR(36)) = ?", (evidence_item_id.upper(),))

        conn.commit()
        return {"message": "Success"}
    except Exception as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}
    finally:
        conn.close()
