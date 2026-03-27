from services.database import get_db_connection
from fastapi import HTTPException
import json

def get_evidence_network() :
    return 


def getGraph(caseId):
    return 


def upload_evidence():
    return

def create_evidence_link(case_id, from_id, to_id, reason, confidence=1.0, created_by: int | None =None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Retrieve the internal Graph Node IDs
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ? and case_id = ?", (from_id, case_id))
        from_node = cursor.fetchone()
        
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ? and case_id = ?", (to_id, case_id))
        to_node = cursor.fetchone()

        if from_node is None:
            raise HTTPException(status_code=404, detail=f"source node {from_id} not found")
        
        if to_node is None: 
            raise HTTPException(status_code=404, detail=f"Target node {to_id} doesn't  exist")
        
        if from_node[0] == to_node[0]:#tuples returned from SQL
            raise HTTPException(status_code=400, detail="cannot create evidence link to the same node")
        
        metadata = json.dumps({"source": "USER", "create_by_user_id": created_by})
        # Insert into Edge table EvidenceLink
        query = """
            INSERT INTO EvidenceLink ($from_id, $to_id, connection_reason, ai_confidence, link_metadata_json)
            VALUES (?, ?, ?, ?)
        """
        cursor.execute(query, (from_node[0], to_node[0], reason, confidence, metadata))
        conn.commit()
        return {
            "case_id": case_id,
            "from": from_id,
            "to": to_id,
            "reason": reason,
            "source": "USER",
            "confidence": confidence,
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
