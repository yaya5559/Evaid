# Author: Bria Tran
# Date: Feburary 4th, 2026
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
from io import BytesIO
from PIL import Image  
from database import get_db_connection

# main function to add evidence to the database
# handles file upload, hashing, and metadata extraction
def add_evidence(case_id, file, related_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # read file bytes and calculate SHA256 hash
    file_bytes = file.file.read()
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # extracting basic metadata
    # TODO: maybe add more metadata fields later?
    metadata = {
        "file_size_kb": round(len(file_bytes) / 1024, 2),
        "original_name": file.filename
    }

    # extract image dimensions if applicable
    # only works for images obviously
    if file.content_type.startswith('image/'):
        try:
            # use PIL to open image and get dimensions
            with Image.open(BytesIO(file_bytes)) as img:
                metadata["dimensions"] = f"{img.width}x{img.height}"
        except Exception:
            # if it fails just mark as unknown, not a big deal
            metadata["dimensions"] = "unknown"
    
    # convert metadata dict to JSON string for storage
    metadata_json = json.dumps(metadata)
    
    # get file extension from filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else ''

    try:
        # save to Evidence NODE table
        insert_query = """
        INSERT INTO Evidence (case_id, FileName, FileExtension, ContentType, FileData, ChecksumSha256, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(insert_query, (
            case_id, file.filename, ext, file.content_type, 
            pyodbc.Binary(file_bytes),  # need to wrap bytes in Binary for SQL
            sha256_hash, 
            metadata_json
        ))
        conn.commit()
        return True
    except Exception as e:
        # if something goes wrong return false
        print(f"Database Error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# retrieves a file from database by ID
def get_evidence_file(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # we now grab the metadata_json along with the file bytes
        cursor.execute("SELECT FileName, ContentType, FileData, metadata_json FROM Evidence WHERE FileId = ?", (file_id,))
        row = cursor.fetchone()
        if row:
            # return everything as a dict
            return {
                "name": row[0], 
                "type": row[1], 
                "bytes": row[2],
                "metadata": json.loads(row[3]) if row[3] else {} # convert JSON back to python dict
            }
        return None
    finally:
        conn.close()

# gets all evidence files connected to a specific file
# uses the graph structure to find connections
def get_related_evidence(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # the MATCH syntax stays the same for querying the graph
        # MATCH(e1-(l)->e2) means "find e2 where there's an edge l from e1 to e2"
        query = """
        SELECT e2.FileId, e2.FileName, l.connection_reason, l.link_metadata_json
        FROM Evidence e1, EvidenceLink l, Evidence e2
        WHERE MATCH(e1-(l)->e2)
        AND e1.FileId = ?
        """
        cursor.execute(query, (file_id,))
        
        # build list of results
        results = []
        for r in cursor.fetchall():
            results.append({
                "id": str(r[0]), 
                "name": r[1], 
                "reason": r[2],
                "link_info": json.loads(r[3]) if r[3] else {}  # parse JSON if exists
            })
        return results
    finally:
        conn.close()

# searches evidence by metadata fields
# ex: search for all images with specific dimensions
def search_evidence_by_metadata(key, value):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # JSON_VALUE lets us pick a specific property out of the JSON string
        # this is how we search inside the JSON column
        query = """
        SELECT FileId, FileName, ContentType, metadata_json
        FROM Evidence
        WHERE JSON_VALUE(metadata_json, ?) = ?
        """
        # example key: '$.dimensions' or '$.file_size_kb'
        # the $ means root of JSON object
        cursor.execute(query, (f"$.{key}", str(value)))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "id": str(row[0]),
                "name": row[1],
                "type": row[2],
                "metadata": json.loads(row[3]) if row[3] else {}
            })
        return results
    finally:
        conn.close()
