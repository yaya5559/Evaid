from uuid import UUID
from services.database import get_db_connection

def get_case_graph(case_id:UUID) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT 
                s.signal_type,
                s.normalized_value
            FROM Signal s
            JOIN  EvidenceItem e on e.Id = s.evidence_id
            WHERE e.case_id = ?                 
        """, str(case_id))

        nodes = []
        for row in cursor.fetchall():
            nodes.append({
                "id": f"{row.signal_type}::{row.normalized_value}",
                "label": row.normalized_value,
                "type": row.signal_type,
            })

        # ── EDGES 
        # Two signals are connected when they co-occur in the same evidence doc.
        # s1.normalized_value < s2.normalized_value avoids duplicate A-B / B-A pairs.
        cursor.execute("""
            SELECT
                s1.signal_type      AS from_type,
                s1.normalized_value AS from_value,
                s2.signal_type      AS to_type,
                s2.normalized_value AS to_value,
                e.title             As evidence_title,
                CAST(e.Id AS NVARCHAR(36)) AS evidence_id
            FROM Signal s1
            JOIN Signal s2
                ON s1.evidence_id = s2.evidence_id
                AND s1.normalized_value  < s2.normalized_value
            JOIN EvidenceItem e on e.Id = s1.evidence_id
            WHERE e.case_id = ?
        """, str(case_id))

        edges = []
        seen = set()
        for row in cursor.fetchall():
            from_id = f"{row.from_type}::{row.from_value}"
            to_id = f"{row.to_type}::{row.to_value}"
            key = f"{from_id}||{to_id}"

            #if the same 2 signals appear in multiple docs,
            #keep onlly one edge but record all evidence sources.
            if key not in seen:
                seen.add(key)
                edges.append({
                    "id":   key,
                    "from": from_id,
                    "to":   to_id,
                    "evidence_title":   row.evidence_title,
                    "evidence_id":  row.evidence_id,
                })

        return {"nodes": nodes, "edges":edges}
    finally:
        conn.close()