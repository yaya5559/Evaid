from services.database import get_db_connection


SIGNAL_TYPE_TO_NODE_TYPE = {
    "person_name":        "person",
    "real_name":          "person",
    "display_name":       "person",
    "alias":              "person",
    "gamertag":           "person",
    "username":           "person",
    "handle":             "person",
    "user_id":            "person",
    "profile_url":        "person",
    "discord_username":   "person",
    "telegram_username":  "person",
    "twitter_handle":     "person",
    "email_address":      "person",
    "phone_number":       "person",
    "ip_address":         "location",
    "location":           "location",
    "city":               "location",
    "country":            "location",
    "address":            "location",
    "server_name":        "location",
    "channel_name":       "location",
    "group_name":         "location",
    "community":          "location",
    "platform":           "location",
    "url":                "location",
    "domain":             "location",
    "invite_code":        "location",
    "event":              "event",
    "date":               "event",
    "timestamp":          "event",
    "transaction":        "event",
}

def _map_node_type(signal_type: str) -> str:
    lower = signal_type.lower()
    for key, node_type in SIGNAL_TYPE_TO_NODE_TYPE.items():
        if key in lower:
            return node_type
    return "evidence"


def get_case_graph(case_id: int) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    case_id_str = str(case_id)

    try:
        # NODES - Confirmed signals
        cursor.execute("""
            SELECT DISTINCT
                s.signal_type,
                s.normalized_value,
                s.raw_value,
                s.confidence,
                'AI' AS source,
                'confirmed' AS triage_status
            FROM Signal s
            JOIN EvidenceItem e ON e.Id = s.evidence_id
            WHERE e.case_id = ?
        """, case_id_str)
        confirmed_rows = cursor.fetchall()

        # Pending signals
        cursor.execute("""
            SELECT DISTINCT
                ps.signal_type,
                ps.normalized_value,
                ps.raw_value,
                ps.confidence,
                'AI' AS source,
                'pending' AS triage_status
            FROM PendingSignal ps
            JOIN EvidenceItem e ON e.Id = ps.evidence_id
            WHERE e.case_id = ?
              AND ps.triage_status = 'pending'
        """, case_id_str)
        pending_rows = cursor.fetchall()

        seen_nodes = set()
        nodes = []

        for row in confirmed_rows + pending_rows:
            node_id = f"{row.signal_type}::{row.normalized_value}"
            if node_id in seen_nodes:
                continue
            seen_nodes.add(node_id)
            nodes.append({
                "id":             node_id,
                "label":          row.normalized_value or row.signal_type,
                "type":           _map_node_type(row.signal_type),
                "source":         row.source,
                "signal_type":    row.signal_type,
                "raw_value":      row.raw_value,
                "normalized_value": row.normalized_value,
                "confidence":     round(float(row.confidence), 3) if row.confidence is not None else None,
                "triage_status":  row.triage_status,
            })

        # EDGES - Confirmed co-occurrence edges
        cursor.execute("""
            SELECT
                s1.signal_type      AS from_type,
                s1.normalized_value AS from_value,
                s2.signal_type      AS to_type,
                s2.normalized_value AS to_value,
                CAST(e.Id AS NVARCHAR(36)) AS evidence_id,
                'AI'                AS source,
                AVG((s1.confidence + s2.confidence) / 2.0) AS confidence
            FROM Signal s1
            JOIN Signal s2
                ON s1.evidence_id = s2.evidence_id
                AND s1.normalized_value < s2.normalized_value
            JOIN EvidenceItem e ON e.Id = s1.evidence_id
            WHERE e.case_id = ?
            GROUP BY s1.signal_type, s1.normalized_value, s2.signal_type, s2.normalized_value, e.Id
        """, case_id_str)
        confirmed_edge_rows = cursor.fetchall()

        # Pending co-occurrence edges
        cursor.execute("""
            SELECT
                ps1.signal_type      AS from_type,
                ps1.normalized_value AS from_value,
                ps2.signal_type      AS to_type,
                ps2.normalized_value AS to_value,
                CAST(e.Id AS NVARCHAR(36)) AS evidence_id,
                'AI'                 AS source,
                AVG((ps1.confidence + ps2.confidence) / 2.0) AS confidence
            FROM PendingSignal ps1
            JOIN PendingSignal ps2
                ON ps1.evidence_id = ps2.evidence_id
                AND ps1.normalized_value < ps2.normalized_value
            JOIN EvidenceItem e ON e.Id = ps1.evidence_id
            WHERE e.case_id = ?
              AND ps1.triage_status = 'pending'
              AND ps2.triage_status = 'pending'
            GROUP BY ps1.signal_type, ps1.normalized_value, ps2.signal_type, ps2.normalized_value, e.Id
        """, case_id_str)
        pending_edge_rows = cursor.fetchall()

        edges = []
        seen_edges = set()

        for row in confirmed_edge_rows + pending_edge_rows:
            from_id = f"{row.from_type}::{row.from_value}"
            to_id   = f"{row.to_type}::{row.to_value}"
            key     = f"{from_id}||{to_id}"
            if key in seen_edges:
                continue
            seen_edges.add(key)
            edges.append({
                "id":          key,
                "From":        from_id,
                "to":          to_id,
                "type":        "co_occurrence",
                "source":      row.source,
                "confidence":  round(float(row.confidence), 3) if row.confidence is not None else None,
                "evidence_id": row.evidence_id,
            })

        return {
            "case_id": case_id_str,
            "nodes":   nodes,
            "edges":   edges,
        }

    finally:
        conn.close()
