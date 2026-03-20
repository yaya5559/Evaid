from datetime import datetime, timezone
from fastapi import Depends, status, APIRouter, UploadFile, File, Form, Response, HTTPException
from services.evidence_service import (
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
from services.graph_service import get_evidence_network
from backend.models.evidenceShape import AttachmentUploadResponse, EvidenceItemCreate, EvidenceItemResponse
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



# @router.post("/upload")
# async def upload_for_preview(
#     case_id: str = Form(...),  #I EXPECT PLAIN TEXT
#     file: UploadFile = File(...), #i EXPECT FILE STREAM
#     user_id: str = Form("System")
# ):
#     # manually convert to int so we can control the error
#     try:
#         int_case_id = int(case_id)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="case_id must be a number")

#     # read raw bytes from the upload
#     file_bytes = await file.read()
    
#     # use the converted int_case_id
#     file_id, metadata = analyze_and_stage_evidence(
#         int_case_id, file.filename, file.content_type, file_bytes, user_id
#     )

#     if not file_id:
#         raise HTTPException(status_code=500, detail="Failed to stage evidence to database")

#     return {
#         "file_id": file_id,
#         "filename": file.filename,
#         "metadata": metadata,
#         "message": "File staged successfully."
#     }

# @router.post("/confirm/{file_id}")
# async def confirm_upload(file_id: str):
#     if confirm_evidence(file_id):
#         return {"status": "success", "message": "Evidence confirmed and saved."}
#     raise HTTPException(status_code=400, detail="Confirmation failed or file not found.")

# @router.delete("/cancel/{file_id}")
# async def cancel_upload(file_id: str):
#     conn = get_db_connection()
#     cursor = conn.cursor()
#     try:
#         # only allow deleting if it hasn't been confirmed yet
#         cursor.execute(
#             "DELETE FROM Evidence WHERE FileId = ? AND processing_status = 'pending'",
#             (file_id,)
#         )
#         conn.commit()
#         return {"status": "cancelled"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         conn.close()

# @router.get("/view/{file_id}")
# async def view_evidence(file_id: str):
#     file_data = get_evidence_file(file_id)
#     if not file_data:
#         raise HTTPException(status_code=404, detail="File not found")


#     # no Content-Disposition header here so browser renders it inline
#     return Response(
#         content=file_data["bytes"],
#         media_type=file_data["type"]
#     )

