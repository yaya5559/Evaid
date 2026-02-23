# Author: Bria Tran
# Date: Feburary 15th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
# 
# Core service for evidence file operations
# This does the actual work of saving files to the database, retrieving them,
# extracting metadata (like image dimensions), and searching through evidence
# Basically all the heavy lifting for file management happens here

import pyodbc
import hashlib
import json
import logging
from database import get_db_connection
from services.chat_parser import parse_chat_log
from services.ocr_service import extract_text_from_evidence

logger = logging.getLogger(__name__)

# this is the main upload function to figure out what kind of file was uploaded
# runs OCR or chat parsing depending on the type
# builds a metadata dict with everything we extracted
# saves it all to the database with status = 'pending'
# (pending means the user hasnt confirmed it yet, they get a preview first)
#
# returns the new file id and the metadata on success
# returns (None, None) if something goes wrong with the db should at least
def analyze_and_stage_evidence(case_id, filename, content_type, file_bytes, user_id="System"):
    conn = get_db_connection()
    cursor = conn.cursor()

    # sha256 hash of the file while useful for detecting duplicate uploads later
    # hashlib does this in one line which is nice
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    text_content = ""
    chat_messages = []
    parse_errors = []

    # figure out what kind of file this is and extract text from it
    # images, pdfs, and word docs go through OCR
    # text-based files go through the chat parser
    if any(t in content_type for t in ["image", "pdf", "docx", "wordprocessingml"]):
        text_content = extract_text_from_evidence(file_bytes, content_type)

    if any(t in content_type for t in ["json", "csv", "plain", "text"]):
        # parse_chat_log returns a tuple of messages and any errors that happened
        chat_messages, parse_errors = parse_chat_log(file_bytes, content_type)
        if parse_errors:
            logger.warning(f"parse errors for '{filename}': {parse_errors}")

    # pull out unique usernames from the parsed messages
    # using set() to remove duplicates, then converting back to a list
    # filtering out "Unknown" since thats just a placeholder
    unique_users = list(set([m['username'] for m in chat_messages if m['username'] != "Unknown"]))

    # build the metadata dict so this gets stored as JSON in the db
    # keeping it flexible so we can add more fields later without changing the schema
    metadata = {
        "file_size_kb":  round(len(file_bytes) / 1024, 2),
        "original_name": filename,
        # cap at 2000 chars so the preview window doesnt try to load a huge string
        # might increase this later if needed
        "extracted_text": text_content[:2000],
        "chat_stats": {
            "message_count": len(chat_messages),
            "participants":   unique_users,
            # check if any message actually has a real timestamp
            "has_timestamps": any(m['timestamp'] != "N/A" for m in chat_messages)
        },
        # include any errors so the preview window can show them to the user
        # empty list if everything went fine
        "parse_errors": parse_errors
    }

    metadata_json = json.dumps(metadata)

    # grab just the file extension from the filename
    # ex. "evidence.pdf" -> "pdf"
    ext = filename.split('.')[-1] if '.' in filename else ''

    try:
        # insert into the Evidence table with status = 'pending'
        # OUTPUT INSERTED.FileId is a SQL Server thing that returns the new row's id right after inserting
        query = """
        INSERT INTO Evidence (case_id, FileName, FileExtension, ContentType, FileData, ChecksumSha256, metadata_json, uploaded_by, processing_status)
        OUTPUT INSERTED.FileId
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """
        cursor.execute(query, (
            case_id, filename, ext, content_type,
            pyodbc.Binary(file_bytes),  # pyodbc.Binary wraps the bytes for the VARBINARY column
            sha256_hash,
            metadata_json,
            user_id
        ))

        new_file_id = cursor.fetchone()[0]
        conn.commit()
        return str(new_file_id), metadata

    except Exception as e:
        logger.error(f"db error while staging '{filename}': {e}")
        return None, None

    finally:
        conn.close()


# called when the user clicks "Confirm" on the preview window
# changes the status from 'pending' to 'confirmed' so its officially saved
def confirm_evidence(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE Evidence SET processing_status = 'confirmed' WHERE FileId = ?",
            (file_id,)
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"couldnt confirm file {file_id}: {e}")
        return False
    finally:
        conn.close()


# retrieves a file from the database so we can send it back to the user
# only returns files that are confirmed
def get_evidence_file(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT FileName, ContentType, FileData, metadata_json
               FROM Evidence
               WHERE FileId = ? AND processing_status = 'confirmed'""",
            (file_id,)
        )
        row = cursor.fetchone()
        if row:
            return {
                "name":     row[0],
                "type":     row[1],
                "bytes":    row[2],
                # parse the json string back into a dict or empty dict if its null
                "metadata": json.loads(row[3]) if row[3] else {}
            }
        # file not found or not confirmed yet
        return None
    finally:
        conn.close()


# for future use to find all the evidence files connected to a given file
# the Evidence table is a NODE and EvidenceLink is an EDGE between nodes
# this isnt hooked up to anything yet but keeping it here for when we build
# the network visualization feature
def get_related_evidence(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # MATCH syntax lets you query the graph like "find everything e1 points to"
        # e1-(l)->e2 means: e1 connected to e2 through link l (directed edge)
        query = """
        SELECT e2.FileId, e2.FileName, l.connection_reason, l.link_metadata_json
        FROM Evidence e1, EvidenceLink l, Evidence e2
        WHERE MATCH(e1-(l)->e2)
        AND e1.FileId = ?
        """
        cursor.execute(query, (file_id,))
        return [
            {
                "id":        str(r[0]),
                "name":      r[1],
                "reason":    r[2],
                "link_info": json.loads(r[3]) if r[3] else {}
            }
            for r in cursor.fetchall()
        ]
    finally:
        conn.close()


# searches evidence by any metadata field
# uses SQL Server's JSON_VALUE function to look inside the metadata_json column
# so you can search by things like file_size_kb or original_name without
# having to add new columns every time we want to store something new
# ex: search_evidence_by_metadata("original_name", "chat_log.txt")
def search_evidence_by_metadata(key, value):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # the $ in the json path just means "start at the root"
        # so "$.file_size_kb" looks for the file_size_kb key at the top level
        query = """
        SELECT FileId, FileName, ContentType, metadata_json
        FROM Evidence
        WHERE JSON_VALUE(metadata_json, ?) = ?
        """
        cursor.execute(query, (f"$.{key}", str(value)))
        return [
            {
                "id":       str(r[0]),
                "name":     r[1],
                "type":     r[2],
                "metadata": json.loads(r[3])
            }
            for r in cursor.fetchall()
        ]
    finally:
        conn.close()


# searches the extracted text content inside evidence files for a keyword
# only searches confirmed evidence for a specific case
# TODO: if we ever store more than 2000 chars of text, this will need to change
#       maybe a separate column or full text search index would be better
def search_evidence_text(case_id, keyword):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT FileId, FileName, ContentType, metadata_json
    FROM Evidence
    WHERE case_id = ?
    AND processing_status = 'confirmed'
    AND CAST(JSON_VALUE(metadata_json, '$.extracted_text') AS NVARCHAR(2000)) LIKE ?
    """
    try:
        cursor.execute(query, (case_id, f"%{keyword}%"))
        return [
            {
                "id":       str(row[0]),
                "name":     row[1],
                "type":     row[2],
                "metadata": json.loads(row[3])
            }
            for row in cursor.fetchall()
        ]
    except Exception as e:
        logger.error(f"text search failed for case {case_id}, keyword '{keyword}': {e}")
        return []
    finally:
        conn.close()