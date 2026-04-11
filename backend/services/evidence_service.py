from uuid import UUID
import hashlib
import pyodbc
import hashlib
import json
import logging
import base64
from services.database import get_db_connection

from datetime import datetime, timezone
from fastapi import Depends, status, APIRouter, UploadFile, File, Form, Response, HTTPException
from typing import Final


logger = logging.getLogger(__name__)

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

#compute SHA256 and total bytes read.
#Resets the file cursor to start before returning.
def _hash_uploadfile_sha256(file:UploadFile):
    sha256 = hashlib.sha256()
    total = 0
    file_bytes = b""

    while True:
        chunk = file.file.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        file_bytes +=chunk
        if total > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code= 413,
                detail=f"File too large. Max is {MAX_UPLOAD_BYTES} bytes.",
            )
        sha256.update(chunk)

    file.file.seek(0)
    return sha256.hexdigest(), total, file_bytes


def _ensure_evidence_exists(cursor, evidence_item_id: UUID) -> None:
    cursor.execute("SELECT 1 FROM EvidenceItem WHERE Id = ?", (evidence_item_id,))
    if cursor.fetchone() is None:
        raise HTTPException(
            status_code=404,
            detail="Evidence item doesn't exist.",
        ) 


def _insert_attachment(
    cursor,
    evidence_item_id: UUID,
    attachment_kind: str,
    file_bytes: bytes,
    checksum_sha256: str,
    captured_at_utc: datetime,
) -> UUID:
    cursor.execute(
        """
            INSERT INTO Attachment
            (evidence_id, attachment_kind, file_bytes, checksum_sha256, attachment_status, captured_at)
            OUTPUT INSERTED.Id
            VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            evidence_item_id,
            attachment_kind,
            file_bytes,
            checksum_sha256,
            ATTACHMENT_STATUS_SAVED,
            captured_at_utc,
        ),
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create attachment.")
    return UUID(row[0])

def _insert_analysis_run(
    cursor,
    evidence_item_id: UUID,
    attachment_id: UUID,
) -> UUID:
    cursor.execute(
        """
        INSERT INTO AnalysisRun
            (evidence_id, attachment_id, run_type, analysisrun_status)
        OUTPUT INSERTED.Id
        VALUES (?, ?, ?, ?)
        """,
        (
            evidence_item_id,
            attachment_id,
            ANALYSISRUN_TYPE_STORAGE,
            ANALYSISRUN_STATUS_INITIAL,
        ),
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create analysis run.")
    return UUID(row[0])

def _get_evidence_case_id(cursor, evidence_item_id: UUID) -> UUID:
    cursor.execute(
        "SELECT case_id FROM EvidenceItem WHERE Id = ?",
        (evidence_item_id,),
    )
    row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Evidence item doesn't exist.")
    return row[0]



def analyze_and_stage_evidence(case_id, filename, content_type, file_bytes, user_id="System"):
    conn = get_db_connection()
    cursor = conn.cursor()

    # create hash for duplicate checking later
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # generate previews (No OCR/AI yet)
    preview_url = None
    text_snippet = ""
    
    # if it's an image, create a Base64 string so frontend can show it immediately
    if "image" in content_type:
        b64_data = base64.b64encode(file_bytes).decode('utf-8')
        preview_url = f"data:{content_type};base64,{b64_data}"
    
    # basic chat parsing
    chat_messages = []
    parse_errors = []
    if any(t in content_type for t in ["json", "csv", "plain", "text"]):
        chat_messages, parse_errors = parse_chat_log(file_bytes, content_type)
        if "text/plain" in content_type:
             text_snippet = file_bytes[:500].decode('utf-8', errors='ignore')

    unique_users = list(set([m['username'] for m in chat_messages if m['username'] != "Unknown"]))

    # construct the metadata JSON
    metadata = {
        "file_size_kb":  round(len(file_bytes) / 1024, 2),
        "original_name": filename,
        "preview_url":   preview_url, # frontend uses this for <img> src
        "text_preview":  text_snippet,
        "chat_stats": {
            "message_count": len(chat_messages),
            "participants":   unique_users
        },
        "parse_errors": parse_errors
    }

    ext = filename.split('.')[-1] if '.' in filename else ''

    try:
        query = """
        INSERT INTO Evidence (case_id, FileName, FileExtension, ContentType, FileData, ChecksumSha256, metadata_json, uploaded_by, processing_status)
        OUTPUT INSERTED.FileId
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """
        cursor.execute(query, (
            case_id, filename, ext, content_type,
            pyodbc.Binary(file_bytes), 
            sha256_hash,
            json.dumps(metadata),
            user_id
        ))

        new_file_id = cursor.fetchone()[0]
        conn.commit()
        return str(new_file_id), metadata
    except Exception as e:
        logger.error(f"DB Error: {e}")
        return None, None
    finally:
        conn.close()

def confirm_evidence(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE Evidence SET processing_status = 'confirmed' WHERE FileId = ?", (file_id,))
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def get_evidence_file(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT FileName, ContentType, FileData FROM Evidence WHERE FileId = ?", (file_id,))
        row = cursor.fetchone()
        if row:
            return {"name": row[0], "type": row[1], "bytes": row[2]}
        return None
    finally:
        conn.close()



