from datetime import datetime, timezone
from fastapi import Depends, status, APIRouter, UploadFile, File, Form, Response, HTTPException
from services.evidence.evidence_service import (
    analyze_and_stage_evidence,
    confirm_evidence,
    get_evidence_file,
    _hash_uploadfile_sha256, 
    _ensure_evidence_exists,
    _insert_analysis_run,
    _insert_attachment,
    _get_evidence_case_id

)
from dependencies.auth import get_current_user, get_user_org_id, case_belong_to_org
from services.evidence.graph_service import get_evidence_network
from models.evidenceShape import AttachmentUploadResponse, EvidenceItemCreate, EvidenceItemResponse
from services.database import get_db_connection
from uuid import UUID
import hashlib
from typing import Final

router = APIRouter(
    prefix="/evidence",
    tags=["evidence"],
    dependencies=[Depends(get_current_user)],
)

CHUNK_SIZE: Final[int] = 8192
MAX_UPLOAD_BYTES: Final[int] =  50 * 1024 *1024 
ALLOWED_CONTENT_TYPES: Final[set[str]] = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain"
}
ATTACHMENT_STATUS_SAVED: Final[str] = "Saved"
ANALYSISRUN_STATUS_INITIAL: Final[str] = "INITIAL_PROCESSING"
ANALYSISRUN_TYPE_STORAGE: Final[str] = "storage"



#create EvidenceItem.
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
                    INSERT INTO EvidenceItem (case_id, evidenceItem_description, title, created_by_user_id, created_at)
                    OUTPUT INSERTED.Id
                    VALUES (?, ?, ?, ?, ?)
                """, (item.case_id, item.description, item.title, user["user_id"], created_at)
                
            )

            evidence_item_id = cursor.fetchone()[0]
            conn.commit()


            return  EvidenceItemResponse(
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
    user = Depends(get_current_user)
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
        return AttachmentUploadResponse(
            attachment_id= attachment_id,
            analysis_run_id= analysis_run_id,
            checksum_sha256= checksum_sha256,
            size_bytes= size_bytes,
            status= ANALYSISRUN_STATUS_INITIAL,
        )
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        # Don’t leak internal exception strings to clients
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()



