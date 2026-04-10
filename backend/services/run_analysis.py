from services.database import get_db_connection
from fastapi import HTTPException
from datetime import datetime, timezone



# worker loop polls for one queued AnalysisRun
# worker atomically marks it running
# worker loads the related attachment bytes
# worker chooses the correct extractor from attachment type
# worker extracts low-level signals
# worker stores signals with provenance
# if extraction completes, mark run succeeded
# if an exception occurs, mark run failed and store the error message


STATUS_QUEUED = "queued"
STATUS_RUNNING = "running"


def claim_next_analysis_run():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                SELECT TOP 1 (Id, evidence_id, attachment_id, run_type) 
                FROM AnalysisRun 
                WHERE analysisrun_status = ? 
                ORDER BY Id
            """, (STATUS_QUEUED,))
        
        row = cursor.fetchone()

        if row is None:
            return None

        run_id = row[0]

        cursor.execute(
            """
                UPDATE AnalysisRun
                SET analysisrun_status = ?, started_at =?
                WHERE Id = ?, AND analysisrun_status = ?
            """, (STATUS_RUNNING, datetime.now(timezone.utc), run_id, STATUS_QUEUED))
        
        if cursor.rowcount == 0:
            conn.rollback()
            return None
        
        conn.commit()

        return {
            "analysis_run_id": row[0],
            "evidence_id": row[1],
            "attachment_id": row[2],
            "run_type": row[3],
        }
    except:
        conn.rollback()
        # Don’t leak internal exception strings to clients
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()



def load_run_attachment(analysis_run_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                SELECT attachment_id FROM AnalysisRun WHERE 
                Id= ?            
            """, (analysis_run_id,))
        
        run_row = cursor.fetchone()

        if run_row is None: 
            return None
        
        attachment_id = run_row[0]
        evidence_id = run_row[1]
        
        cursor.execute(
            """
                SELECT file_bytes FROM Attachment
                WHERE Id = ?
            """, (attachment_id,)
        )
        attachment_row  = cursor.fetchone()

        if attachment_row is None:
            return None

        return{
            "analysis_run_id": analysis_run_id,
            "evidence_id": evidence_id,
            "attachment_id": attachment_id,
            "attachment_kind": attachment_row[0],
            "file_bytes": attachment_row[1],
        }

    finally:
        conn.close()

#choose extractor by MIME type
def select_extractor(attachment_kind):
    kind = (attachment_kind or "").lower()

    if kind.startswith("text/"):
        return
    return 

    



def run_analysis(analysis_run_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                SELECT (evidence_id, attachment_id)
                FROM AnalysisRun WHERE Id = ?                       
            """, (analysis_run_id,)
        )

        evidence_id, attachement_id = cursor.fetchall()

        cursor.execute(
            """
                SELECT (attachment_kind, file_bytes, attachment_status)
                FROM Attachment WHERE Id = ?
            """, (attachement_id)
        )
        attachement =  cursor.fetchone()
        if attachement is None:
            raise HTTPException(status_code=400 , detail="Attachement not Found")
        


    
    except Exception as e:

