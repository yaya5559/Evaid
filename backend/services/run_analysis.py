from services.database import get_db_connection
from fastapi import HTTPException, status
from datetime import datetime, timezone
from services.extractors import DocumentExtractor
from services.evidence.signal_pipline import run_llm_extraction, run_universal_extraction, detect_platform
from models.evidenceShape import ExtractedSignal
import json


# worker loop polls for one queued AnalysisRun
# worker atomically marks it running
# worker loads the related attachment bytes
# worker chooses the correct extractor from attachment type
# worker extracts low-level signals
# worker stores signals with provenance
# if extraction completes, mark run succeeded
# if an exception occurs, mark run failed and store the error message


STATUS_QUEUED = "INITIAL_PROCESSING"
STATUS_RUNNING = "running"


def claim_next_analysis_run():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        
        cursor.execute(
            """
                SELECT TOP 1 Id, evidence_id, attachment_id, run_type
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
                WHERE Id = ? AND analysisrun_status = ?
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
        raise 
    finally:
        conn.close()

def load_run_attachment(analysis_run_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                SELECT attachment_id, evidence_id FROM AnalysisRun WHERE 
                Id= ?            
            """, (analysis_run_id,))
        
        run_row = cursor.fetchone()

        if run_row is None: 
            return None
        
        attachment_id = run_row[0]
        evidence_id = run_row[1]
        
        cursor.execute(
            """
                SELECT attachment_kind, file_bytes FROM Attachment
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
    if attachment_kind in DocumentExtractor.SUPPORTED_TYPES:
        return DocumentExtractor()
    return None

def run_analysis(analysis_run_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                SELECT evidence_id, attachment_id
                FROM AnalysisRun WHERE Id = ?                       
            """, (analysis_run_id,)
        )

        row = cursor.fetchone()
        evidence_id = row[0]
        attachement_id = row[1]

        cursor.execute(
            """
                SELECT attachment_kind, file_bytes, attachment_status
                FROM Attachment WHERE Id = ?
            """, (attachement_id, )
        )
        attachement =  cursor.fetchone()
        if attachement is None:
            raise HTTPException(status_code=400 , detail="Attachement not Found")
        
        extractor = select_extractor(attachement[0])

        if extractor is None:
            raise ValueError(f"Unsupported attachment type: {attachement[0]}")

        markdown = extractor.extract_to_markdown(attachement[1], attachement[0])

        cursor.execute(
            """
                SELECT case_id FROM EvidenceItem
                WHERE Id = ?
            """, (evidence_id,)
        )

        case_id = cursor.fetchone()[0]
        
        regex_signals = run_universal_extraction(markdown, attachement_id, cursor)
        platform, confidence, reasoning = detect_platform(markdown)
        extctractedSignals: list[ExtractedSignal] = run_llm_extraction(markdown, platform, case_id, attachement_id, cursor)

        total_signals = regex_signals + extctractedSignals

        for  signal in total_signals:
            if signal.source_locator["method"] == "regex":
                cursor.execute(
                    """
                        INSERT INTO Signal 
                            (evidence_id, attachment_id, analysis_run_id,
                            signal_type, raw_value, normalized_value,
                            confidence, source_locator                                                    
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, 
                    (
                        evidence_id, attachement_id, analysis_run_id,
                        signal.signal_type, signal.raw_value, signal.normalized_value,
                        signal.confidence, json.dumps(signal.source_locator)
                    )
                )
            else:
                cursor.execute(
                    """
                        INSERT INTO PendingSignal (evidence_id, attachment_id, analysis_run_id,
                                                    signal_type, raw_value, normalized_value,
                                                    confidence, source_locator,
                                                    triage_reason, triage_status)
                                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                            evidence_id, attachement_id, analysis_run_id, signal.signal_type,
                            signal.raw_value, signal.normalized_value, signal.confidence,
                            json.dumps(signal.source_locator), 'llm_extracted', 'pending'
                        )
                )
        
        conn.commit()
        cursor.execute(
            "UPDATE AnalysisRun SET analysisrun_status = 'success', finished_at = ? WHERE Id = ?",
            (datetime.now(timezone.utc), analysis_run_id)
        )
        conn.commit()          
    except Exception as e:
        conn.rollback()
        cursor.execute(
            "UPDATE AnalysisRun SET analysisrun_status = 'failed', error_message = ? WHERE Id = ?",
            (str(e), analysis_run_id)
        )
        conn.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
    finally:
        conn.close()


