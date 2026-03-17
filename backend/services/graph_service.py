# Author: Bria Tran
# Date: Feburary 4th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
# 
# Handles the graph database operations for linking evidence
# This is where we create connections between files and query the network
# Uses Azure SQL Server's graph features to build relationships between evidence

from database import get_db_connection

def create_evidence_link(from_id, to_id, reason, confidence=1.0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Retrieve the internal Graph Node IDs
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ?", (from_id,))
        from_node = cursor.fetchone()
        
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ?", (to_id,))
        to_node = cursor.fetchone()

        if not from_node or not to_node:
            return False

        # Insert into Edge table EvidenceLink
        query = """
        INSERT INTO EvidenceLink ($from_id, $to_id, connection_reason, ai_confidence)
        VALUES (?, ?, ?, ?)
        """
        cursor.execute(query, (from_node[0], to_node[0], reason, confidence))
        conn.commit()
        return True
    except Exception as e:
        print(f"Graph Connection Error: {e}")
        return False
    finally:
        conn.close()
