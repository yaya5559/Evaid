import datetime
from fastapi import Depends, APIRouter, UploadFile, File, Form, Response, HTTPException
from services.evidence_service import (
    analyze_and_stage_evidence,
    confirm_evidence,
    get_evidence_file
)
from dependencies.auth import get_current_user, get_user_org_id, case_belong_to_org
from services.graph_service import get_evidence_network
from backend.models.evidenceShape import EvidenceItemCreate, EvidenceItemResponse
from services.database import get_db_connection


router = APIRouter(
    prefix="/evidence",
    tags=["evidence"],
    dependencies=[Depends(get_current_user)],
)

#create EvidenceItem.
@router.post("/EvidenceItem")
async def Create_EvidenceItem(
        item: EvidenceItemCreate,
        user: dict = Depends(get_current_user)
    ):
    
        case_id = int(item.case_id)
        org_id = get_user_org_id(user["user_id"])
        if org_id is None or not case_belong_to_org(case_id, org_id):
            raise HTTPException(status_code=403, detail="Forbidden for this case")
        

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            created_at = datetime.datetime.now()

            cursor.execute(
                "INSERT INTO EvidenceItem (case_id, evidenceItem_description, title, created_by_user_id, created_at)" \
                "VALUES (?, ?, ?, ?, ?)", (item.case_id, item.description, item.title, user["user_id"], created_at)
            )

            evidence_item_id = cursor.fetchone()[0]
            conn.commit()


            return  EvidenceItemResponse(
                evidence_item_id=evidence_item_id,
                created_at=created_at,
                status="queued",
                message="Evidence item created successfully"

            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
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

@router.post("/confirm/{file_id}")
async def confirm_upload(file_id: str):
    if confirm_evidence(file_id):
        return {"status": "success", "message": "Evidence confirmed and saved."}
    raise HTTPException(status_code=400, detail="Confirmation failed or file not found.")

@router.delete("/cancel/{file_id}")
async def cancel_upload(file_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # only allow deleting if it hasn't been confirmed yet
        cursor.execute(
            "DELETE FROM Evidence WHERE FileId = ? AND processing_status = 'pending'",
            (file_id,)
        )
        conn.commit()
        return {"status": "cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/view/{file_id}")
async def view_evidence(file_id: str):
    file_data = get_evidence_file(file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")


    # no Content-Disposition header here so browser renders it inline
    return Response(
        content=file_data["bytes"],
        media_type=file_data["type"]
    )

