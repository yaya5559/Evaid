# Author: Bria Tran
# Date: Feburary 4th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
# 
# This file handles all the API endpoints for evidence management
# Basically this is where the frontend hits when users want to upload files,
# download them, view them, or search through evidence

from fastapi import APIRouter, UploadFile, File, Form, Response, HTTPException, BackgroundTasks
from services.evidence_service import (
    analyze_and_stage_evidence,
    confirm_evidence,
    get_evidence_file,
    search_evidence_by_metadata
)
from services.graph_service import get_evidence_network, create_evidence_link
from database import get_db_connection
import json

# all routes in this file will start with /evidence
router = APIRouter(prefix="/evidence", tags=["evidence"])


# UPLOAD & PREVIEW
# this is a two step process:
# POST /evidence/upload  -> saves as 'pending' returns preview data
# POST /evidence/confirm -> user confirms, status flips to 'confirmed'
# OR DELETE /evidence/cancel -> user cancels, pending record gets deleted

# handles the initial file upload
# reads the file, runs extraction, stores it as 'pending' and returns a preview
# for the frontend uses the preview data to show the user what was extracted
# before they officially confirm the upload
@router.post("/upload")
async def upload_for_preview(
    case_id: int = Form(...),        # which case this evidence belongs to
    file: UploadFile = File(...),    # the actual file
    user_id: str = Form("System")    # who uploaded it and defaults to System for now
):
    file_bytes = await file.read()

    # analyze_and_stage_evidence does heavy liftin
    # runs OCR or chat parsing, builds metadata, stores in db as 'pending'
    file_id, preview_data = analyze_and_stage_evidence(
        case_id, file.filename, file.content_type, file_bytes, user_id
    )

    # if staging failed for some reason, return a 500
    if not file_id:
        raise HTTPException(status_code=500, detail="Failed to stage evidence")

    # return everything the frontend needs to show the preview window
    # extraction_warnings surfaces any parse errors so the user knows if
    # something didnt extract correctly
    return {
        "file_id":              file_id,
        "filename":             file.filename,
        "preview":              preview_data,
        "storage_path":         f"db://pending/{file_id}",
        "extraction_warnings":  preview_data.get("parse_errors", []),
        "message":              "Preview generated. Please confirm or cancel."
    }


# called when the user clicks "Confirm" in the preview window
# changes the evidence status from 'pending' to 'confirmed' so its saved for real
@router.post("/confirm/{file_id}")
async def confirm_upload(file_id: str):
    if confirm_evidence(file_id):
        return {"status": "success", "message": "Evidence saved permanently."}
    # if confirm_evidence returned False something went wrong in the db
    raise HTTPException(status_code=400, detail="Confirmation failed or file not found.")


# called when the user clicks "Cancel" in the preview window
# deletes the pending record so we dont have orphaned files sitting in the db
# the AND processing_status = 'pending' check makes sure we cant accidentally
# delete something that was already confirmed for now
@router.delete("/cancel/{file_id}")
async def cancel_upload(file_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM Evidence WHERE FileId = ? AND processing_status = 'pending'",
            (file_id,)
        )
        conn.commit()
        return {"status": "cancelled", "message": "Pending evidence removed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel upload: {str(e)}")
    finally:
        conn.close()



# for the evidence relationship visualization but not fully built out yet
# just put the endpoints here so the frontend has something to call
# returns the network of connections for a given piece of evidence
# the frontend uses this to draw the relationship graph
@router.get("/network/{file_id}")
async def get_network(file_id: str):
    connections = get_evidence_network(file_id)
    return {"connections": connections}


# two slightly different endpoints but download forces a file save dialog
# view lets the browser render it inline (useful for images and pdfs)
# sends the file back as an attachment (triggers browser download)
# just in case we want to build this out int later sprints
@router.get("/download/{file_id}")
async def download_file(file_id: str):
    file = get_evidence_file(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Content-Disposition: attachment tells the browser to download it
    # instead of trying to open it in the tab
    return Response(
        content=file["bytes"],
        media_type=file["type"],
        headers={"Content-Disposition": f"attachment; filename={file['name']}"}
    )


# sends the file back inline so the browser can display it directly
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

# searches evidence by any metadata field using JSON_VALUE in SQL
# ex. GET /evidence/search?key=original_name&value=chat_log.txt
# or  GET /evidence/search?key=file_size_kb&value=12.5
@router.get("/search")
async def search_metadata(key: str, value: str):
    results = search_evidence_by_metadata(key, value)
    return {"results": results}