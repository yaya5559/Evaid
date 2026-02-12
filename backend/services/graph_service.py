# Author: Bria Tran
# Date: Feburary 4th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
# 
# Handles the graph database operations for linking evidence
# This is where we create connections between files and query the network
# Uses Azure SQL Server's graph features to build relationships between evidence

import pyodbc
from database import get_db_connection

# this function creates the 'line' (Edge) between two files
# from_id and to_id are the FileIds of the evidence we're connecting
def create_evidence_link(from_id, to_id, reason, confidence=1.0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # we need the internal graph IDs ($node_id) to make a connection
        # $node_id is a special column that SQL Server uses for graph tables
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ?", (from_id,))
        from_node = cursor.fetchone()
        
        cursor.execute("SELECT $node_id FROM Evidence WHERE FileId = ?", (to_id,))
        to_node = cursor.fetchone()

        # make sure both nodes exist before trying to link them
        if not from_node or not to_node:
            return False

        # inserting into an EDGE table needs the special $from_id and $to_id columns
        # these are different from regular columns, they reference the node IDs
        query = """
        INSERT INTO EvidenceLink ($from_id, $to_id, connection_reason, ai_confidence)
        VALUES (?, ?, ?, ?)
        """
        cursor.execute(query, (from_node[0], to_node[0], reason, confidence))
        conn.commit()
        return True
    except Exception as e:
        print(f"Graph Connection Error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# this function finds everything connected to a specific file
# returns list of connected evidence with their connection info
def get_evidence_network(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # MATCH(e1-(l)->e2) is the standard way to 'walk' through the graph in SQL
        # e1 is our starting evidence, l is the link, e2 is the connected evidence
        query = """
        SELECT e2.FileId, e2.FileName, l.connection_reason, l.ai_confidence
        FROM Evidence e1, EvidenceLink l, Evidence e2
        WHERE MATCH(e1-(l)->e2)
        AND e1.FileId = ?
        """
        cursor.execute(query, (file_id,))
        
        # build the result list with all connected files
        return [{"id": str(r[0]), "name": r[1], "reason": r[2], "confidence": r[3]} for r in cursor.fetchall()]
    finally:
        conn.close()
