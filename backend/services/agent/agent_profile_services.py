from services.database import get_db_connection
import pyodbc


def _user_has_column(cursor, column_name: str) -> bool:
    cursor.execute(
        """
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'dbo'
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = ?
        """,
        (column_name,)
    )
    return cursor.fetchone() is not None


def _ensure_profile_picture_column(cursor) -> None:
    if not _user_has_column(cursor, 'profile_picture'):
        cursor.execute("ALTER TABLE dbo.users ADD profile_picture NVARCHAR(MAX) NULL")


def get_agent_profile(agent_id: int):
    """Fetch agent profile by user_id"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        has_profile_picture = _user_has_column(cursor, 'profile_picture')
        columns = [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
        if has_profile_picture:
            columns.append("profile_picture")

        query = f"SELECT {', '.join(columns)} FROM users WHERE user_id = ? AND deleted_at IS NULL"
        cursor.execute(query, (agent_id,))
        row = cursor.fetchone()
        
        if not row:
            return {"message": "Agent not found"}
        
        profile_picture = None
        if has_profile_picture:
            profile_picture = row[5] or None

        return {
            "message": "Success",
            "user_id": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "phone_number": row[4] or "",
            "profile_picture": profile_picture
        }
    except pyodbc.Error as e:
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()


def update_agent_profile(agent_id: int, first_name: str = None, last_name: str = None, phone_number: str = None, profile_picture: str = None):
    """Update agent profile"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Build dynamic update query
        updates = []
        params = []
        
        if first_name is not None:
            updates.append("first_name = ?")
            params.append(first_name)
        
        if last_name is not None:
            updates.append("last_name = ?")
            params.append(last_name)
        
        if phone_number is not None:
            updates.append("phone_number = ?")
            params.append(phone_number)
        
        has_profile_picture = _user_has_column(cursor, 'profile_picture')
        if profile_picture is not None:
            if not has_profile_picture:
                _ensure_profile_picture_column(cursor)
                has_profile_picture = True
            updates.append("profile_picture = ?")
            params.append(profile_picture)
        
        if not updates:
            return {"message": "Error", "error": "No fields to update"}
        
        updates.append("updated_at = SYSDATETIMEOFFSET()")
        params.append(agent_id)
        
        query = f"""
            UPDATE users
            SET {', '.join(updates)}
            WHERE user_id = ? AND deleted_at IS NULL
        """
        
        cursor.execute(query, params)
        conn.commit()
        
        if cursor.rowcount == 0:
            return {"message": "Error", "error": "Agent not found"}
        
        # Fetch and return updated profile
        return get_agent_profile(agent_id)
    
    except pyodbc.Error as e:
        conn.rollback()
        return {"message": "Error", "error": str(e)}
    finally:
        cursor.close()
        conn.close()
