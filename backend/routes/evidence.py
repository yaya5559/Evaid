from datetime import datetime, timezone
from fastapi import Depends, status, APIRouter, UploadFile, File, HTTPException
import threading
from services.run_analysis import run_analysis
from services.evidence.triage_service import confirm_pending_signal, reject_pending_signals, get_signal_history
from services.evidence_service import (
    _hash_uploadfile_sha256,
    _ensure_evidence_exists,
    _insert_analysis_run,
    _insert_attachment,
    _get_evidence_case_id,
    get_confirmed_signals
)
from services.evidence.triage_service import get_pending_signals
from dependencies.auth import get_current_user, get_user_org_id, case_belong_to_org
from models.evidenceShape import AttachmentUploadResponse, EvidenceItemCreate, EvidenceItemResponse
from services.database import get_db_connection
from uuid import UUID
from typing import Final


router = APIRouter(
    prefix="/evidence",
    tags=["evidence"],
    dependencies=[Depends(get_current_user)],
)

CHUNK_SIZE: Final[int] = 8192
MAX_UPLOAD_BYTES: Final[int] = 50 * 1024 * 1024
ALLOWED_CONTENT_TYPES: Final[set[str]] = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/tiff",
    "text/plain",
    "text/csv",
}
ATTACHMENT_STATUS_SAVED: Final[str] = "Saved"
ANALYSISRUN_STATUS_INITIAL: Final[str] = "INITIAL_PROCESSING"
ANALYSISRUN_TYPE_STORAGE: Final[str] = "storage"


@router.post("/EvidenceItem")
async def Create_EvidenceItem(
        item: EvidenceItemCreate,
        user: dict = Depends(get_current_user)
    ):
        case_id = item.case_id
        org_id = get_user_org_id(user["user_id"])
        if org_id is None or not case_belong_to_org(case_id, org_id):
            raise HTTPException(status_code=403, detail="Forbidden for this case")

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            created_at = datetime.now(timezone.utc)
            cursor.execute(
                """
                    INSERT INTO EvidenceItem
                        (case_id, evidenceItem_description, title, created_by_user_id, created_at, agent_context)
                    OUTPUT INSERTED.Id
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (item.case_id, item.description, item.title, user["user_id"], created_at, item.agent_context)
            )
            evidence_item_id = cursor.fetchone()[0]
            conn.commit()
            return EvidenceItemResponse(
                evidenceItem_id=evidence_item_id,
                created_at=created_at,
                status="created",
                message="Evidence item created successfully"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            conn.close()


@router.post("/{evidence_item_id}/attachments", status_code=status.HTTP_201_CREATED)
async def upload_attachement(
    evidence_item_id: UUID,
    attachement: UploadFile = File(...),
    user=Depends(get_current_user)
):
    if not attachement.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")
    if attachement.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {attachement.content_type}",
        )

    checksum_sha256, size_bytes, file_bytes = _hash_uploadfile_sha256(attachement)
    captured_at_utc = datetime.now(timezone.utc)

    conn = get_db_connection()
    org_id = get_user_org_id(user["user_id"])
    try:
        cursor = conn.cursor()
        if org_id is None:
            raise HTTPException(status_code=403, detail="Forbidden")
        case_id = _get_evidence_case_id(cursor, evidence_item_id)
        if not case_belong_to_org(case_id, org_id):
            raise HTTPException(status_code=403, detail="Forbidden for this case")
        _ensure_evidence_exists(cursor, evidence_item_id)
        attachment_id = _insert_attachment(
            cursor=cursor,
            evidence_item_id=evidence_item_id,
            attachment_kind=attachement.content_type,
            file_bytes=file_bytes,
            checksum_sha256=checksum_sha256,
            captured_at_utc=captured_at_utc,
        )
        analysis_run_id = _insert_analysis_run(
            cursor=cursor,
            evidence_item_id=evidence_item_id,
            attachment_id=attachment_id,
        )
        conn.commit()
        threading.Thread(target=run_analysis, args=(analysis_run_id,), daemon=True).start()
        return AttachmentUploadResponse(
            attachment_id=attachment_id,
            analysis_run_id=analysis_run_id,
            checksum_sha256=checksum_sha256,
            size_bytes=size_bytes,
            status=ANALYSISRUN_STATUS_INITIAL,
        )
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


@router.get("/item/{evidence_id}")
async def get_evidence_item(evidence_id: UUID):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                CAST(Id AS NVARCHAR(36)) AS file_id,
                title AS file_name,
                created_at AS upload_date,
                'confirmed' AS processing_status
            FROM EvidenceItem
            WHERE Id = ?
        """, (str(evidence_id),))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Evidence item not found.")
        cols = [col[0] for col in cursor.description]
        return dict(zip(cols, row))
    finally:
        conn.close()


# Must be before /{evidence_id}/pending-signals to avoid route conflict
@router.get("/pending-signals/case/{case_id}")
async def list_pending_signals_for_case(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                CAST(ps.Id AS NVARCHAR(36)) AS id,
                ps.signal_type, ps.raw_value, ps.normalized_value,
                ps.confidence, ps.source_locator, ps.triage_reason,
                CAST(ps.evidence_id AS NVARCHAR(36)) AS evidence_id
            FROM PendingSignal ps
            JOIN EvidenceItem ei ON ei.Id = ps.evidence_id
            WHERE ei.case_id = ? AND ps.triage_status = 'pending'
            ORDER BY ps.confidence DESC
        """, (case_id,))
        rows = cursor.fetchall()
        cols = [col[0] for col in cursor.description]
        return [dict(zip(cols, row)) for row in rows]
    finally:
        conn.close()


@router.get("/{evidence_id}/pending-signals")
async def list_pending_signals(evidence_id: UUID):
    return get_pending_signals(evidence_id)


@router.get("/{evidence_id}/signal-history")
async def get_evidence_signal_history(evidence_id: UUID):
    return get_signal_history(evidence_id)


@router.patch("/pending-signals/{pending_signal_id}/confirm")
async def confirmSignals(pending_signal_id: UUID):
    return confirm_pending_signal(pending_signal_id)


@router.delete("/pending-signals/{pending_signal_id}/reject")
async def rejectSignals(pending_signal_id: UUID):
    reject_pending_signals(pending_signal_id)


@router.get("/correlations/{case_id}")
async def get_case_correaltion(case_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                cc.case_id_b AS related_case_id,
                c.title AS related_case_title,
                c.status AS related_case_status,
                cc.signal_type,
                cc.shared_value,
                cc.confidence,
                cc.created_at
            FROM CaseCorrelation cc
            JOIN Cases c ON CAST(c.case_id AS NVARCHAR(50)) = case_id_b
            WHERE cc.case_id_a = ?
                AND c.deleted_at IS NULL
                       
            UNION
                       
            SELECT
                cc.case_id_a AS related_case_id,
                c.title      AS related_case_title,
                c.status     AS related_case_status,
                cc.signal_type,
                cc.shared_value,
                cc.confidence,
                cc.created_at
            FROM CaseCorrelation cc
            JOIN Cases c ON CAST(c.case_id AS NVARCHAR(50)) = cc.case_id_a
            WHERE cc.case_id_b = ?
              AND c.deleted_at IS NULL

            ORDER BY cc.confidence DESC                 
            """,(case_id, case_id)                       
        )
        rows = cursor.fetchall()
        return [
            {
                "related_case_id": str(row[0]),
                "related_case_title": row[1],
                "related_case_status": row[2],
                "signal_type": row[3],
                "shared_value": row[4],
                "confidence": row[5],
                "created_at": str(row[6]),
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/confirmedSignals/{case_id}")
async def get_confirmed_signals_for_case(case_id: str):
    return get_confirmed_signals(case_id)
