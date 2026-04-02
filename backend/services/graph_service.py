<<<<<<< HEAD
﻿from services.database import get_db_connection
from fastapi import HTTPException
import json

def get_evidence_network() :
    return 


def getGraph(caseId):
    return 

=======
from services.database import get_db_connection
from fastapi import HTTPException
import json

def get_evidence_network():
    pass 

def getGraph(caseId):
    pass 
>>>>>>> origin/main

def upload_evidence():
    return

<<<<<<< HEAD
def create_evidence_link(case_id, from_id, to_id, reason, confidence=1.0, created_by: int | None =None):
=======
def create_evidence_link(case_id, from_id, to_id, reason, confidence=1.0, created_by: int | None = None):
>>>>>>> origin/main
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
<<<<<<< HEAD
        # Retrieve the internal Graph Node IDs
=======
>>>>>>> origin/main
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ? and case_id = ?", (from_id, case_id))
        from_node = cursor.fetchone()
        
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ? and case_id = ?", (to_id, case_id))
        to_node = cursor.fetchone()

        if from_node is None:
            raise HTTPException(status_code=404, detail=f"source node {from_id} not found")
        
        if to_node is None: 
<<<<<<< HEAD
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
=======
            raise HTTPException(status_code=404, detail=f"Target node {to_id} doesn't exist")
        
        if from_node == to_node: 
            raise HTTPException(status_code=400, detail="cannot create evidence link to the same node")
        
        metadata = json.dumps({"source": "USER", "create_by_user_id": created_by})
        
        query = """
            INSERT INTO EvidenceLink ($from_id, $to_id, connection_reason, ai_confidence, link_metadata_json)
            VALUES (?, ?, ?, ?, ?)
        """
        cursor.execute(query, (from_node, to_node, reason, confidence, metadata))
        conn.commit()
        
>>>>>>> origin/main
        return {
            "case_id": case_id,
            "from": from_id,
            "to": to_id,
            "reason": reason,
            "source": "USER",
            "confidence": confidence,
        }
<<<<<<< HEAD
=======
    except HTTPException:
        raise
>>>>>>> origin/main
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
<<<<<<< HEAD
        conn.close()

=======
        conn.close()
>>>>>>> origin/main
