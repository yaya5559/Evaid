from fastapi import HTTPException
from services.database import get_db_connection


def list_actors_for_case(case_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT
                CAST(ap.actor_id AS NVARCHAR(36)),
                ap.actor_name,
                ca.role,
                ca.confidence_score,
                ca.source,
                CAST(ca.created_at AS NVARCHAR(50))
            FROM ActorProfile ap
            JOIN CaseActor ca ON ca.actor_id = ap.actor_id
            WHERE ca.case_id = ?
            ORDER BY ca.confidence_score DESC, ap.actor_name
        """, (case_id,))
        rows = cursor.fetchall()

        actors = []
        for row in rows:
            actor_id = row[0]
            cursor.execute("SELECT alias_value FROM ActorAlias WHERE actor_id = ?", (actor_id,))
            aliases = [r[0] for r in cursor.fetchall()]
            actors.append({
                "id": actor_id,
                "primaryName": row[1],
                "role": row[2],
                "confidenceScore": row[3],
                "source": row[4],
                "createdAt": row[5],
                "aliases": aliases,
            })

        return actors

    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()



def create_actor(case_id: int, name: str, role: str, source: str, confidence_score=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # reuse actor if name already exists
        cursor.execute("SELECT CAST(actor_id AS NVARCHAR(36)) FROM ActorProfile WHERE actor_name = ?", (name,))
        existing = cursor.fetchone()
        if existing:
            actor_id = existing[0]
        else:
            cursor.execute(
                "INSERT INTO ActorProfile (actor_name) OUTPUT CAST(INSERTED.actor_id AS NVARCHAR(36)) VALUES (?)",
                (name,)
            )
            actor_id = cursor.fetchone()[0]

        # check not already linked to this case
        cursor.execute("SELECT 1 FROM CaseActor WHERE case_id = ? AND actor_id = ?", (case_id, actor_id))
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="Actor already linked to this case.")

        cursor.execute(
            "INSERT INTO CaseActor (case_id, actor_id, role, confidence_score, source) VALUES (?,?,?,?,?)",
            (case_id, actor_id, role, confidence_score, source)
        )
        conn.commit()
        return {"id": actor_id, "primaryName": name, "role": role, "source": source, "aliases": []}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def add_alias(actor_id: str, alias_value: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM ActorProfile WHERE actor_id = ?", (actor_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Actor not found.")

        cursor.execute(
            "INSERT INTO ActorAlias (actor_id, alias_value) VALUES (?,?)", (actor_id, alias_value)
        )
        conn.commit()
        return {"message": "Alias added."}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()


def add_note(actor_id: str, content: str, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM ActorProfile WHERE actor_id = ?", (actor_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Actor not found.")

        cursor.execute(
            "INSERT INTO ActorNote (actor_id, content, created_by) OUTPUT INSERTED.note_id VALUES (?,?,?)",
            (actor_id, content, user_id)
        )
        note_id = cursor.fetchone()[0]
        conn.commit()
        return {"note_id": note_id, "content": content}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()



def get_actor_detail(actor_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT CAST(actor_id AS NVARCHAR(36)), actor_name, CAST(created_at AS NVARCHAR(50))
            FROM ActorProfile WHERE actor_id = ?
        """, (actor_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Actor not found.")
        
        cursor.execute("SELECT alias_value FROM ActorAlias WHERE actor_id = ?", (actor_id,))
        aliases = [r[0] for r in cursor.fetchall()]

        cursor.execute("""
            SELECT note_id, content, created_by,
                   CAST(created_at AS NVARCHAR(50)), CAST(updated_at AS NVARCHAR(50))
            FROM ActorNote WHERE actor_id = ? ORDER BY created_at DESC
        """, (actor_id,))

        notes = [
            {"note_id": r[0], "content": r[1], "created_by": r[2], "created_at": r[3], "updated_at": r[4]}
            for r in cursor.fetchall()
        ]

        return {"id": row[0], "primaryName": row[1], "createdAt": row[2], "aliases": aliases, "notes": notes}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error.")
    finally:
        conn.close()