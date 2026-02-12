# Author: Bria Tran
# Date: Feburary 4th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
# 
# This file handles all the API endpoints for evidence management
# Basically this is where the frontend hits when users want to upload files,
# download them, view them, or search through evidence

from fastapi import APIRouter, UploadFile, File, Form, Response, HTTPException
# import the new graph and search services
from services.evidence_service import (
    add_evidence, 
    get_evidence_file, 
    search_evidence_by_metadata 
)
from services.graph_service import get_evidence_network, create_evidence_link
from services.graph_service import get_evidence_network

# setting up the router for all evidence related endpoints
router = APIRouter(prefix="/evidence", tags=["evidence"])

# handles file uploads for evidence
# TODO: maybe add file type validation later?
@router.post("/upload")
async def upload_evidence(case_id: int = Form(...), file: UploadFile = File(...), related_id: str = Form(None)):
    # calls the service function to actually save the file
    if add_evidence(case_id, file, related_id):
        return {"message": "Evidence uploaded and linked."}
    # if it fails just throw an error
    raise HTTPException(status_code=500, detail="Upload failed.")

# ROUTE FOR THE VISUAL GRAPH 
# this is for showing the connections between evidence files
@router.get("/network/{file_id}")
async def get_network(file_id: str):
    # pulls the spiderweb of connections for the UI
    connections = get_evidence_network(file_id)
    return {"connections": connections}

# lets users download evidence files 
@router.get("/download/{file_id}")
async def download_file(file_id: str):
    # get the file from database
    file = get_evidence_file(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # send it back as downloadable attachment
    return Response(
        content=file["bytes"],
        media_type=file["type"],
        headers={"Content-Disposition": f"attachment; filename={file['name']}"}
    )

# view evidence without downloading (for images/pdfs)
@router.get("/view/{file_id}")
async def view_evidence(file_id: str):
    file_data = get_evidence_file(file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")

    # just return the raw bytes so browser can display it
    return Response(
        content=file_data["bytes"], 
        media_type=file_data["type"]
    )

# search through evidence metadata (like file size, dimensions, etc)
@router.get("/search")
async def search_metadata(key: str, value: str):
    # searches the JSON metadata we extracted (size, dimensions, etc.)
    results = search_evidence_by_metadata(key, value)
    return {"results": results}
