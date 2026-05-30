from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from passlib.context import CryptContext
from dependencies.auth import get_current_user
from services.database import get_db_connection
from typing import Optional
import hashlib
import traceback

router = APIRouter(prefix="/user", tags=["Profile"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)


class ProfileUpdate(BaseModel):
    name: str
    company: Optional[str] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT u.first_name, u.last_name, u.email, r.role_name,
                   o.name AS company, u.phone_number,
                   CONVERT(NVARCHAR(50), u.last_login_at, 127)
            FROM users u
            JOIN roles r ON r.role_id = u.role_id
            LEFT JOIN organizations o ON o.org_id = u.org_id
            WHERE u.user_id = ? AND u.deleted_at IS NULL
            """,
            (user_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        first_name, last_name, email, role, company, phone_number, last_login_at = row
        login_str = last_login_at if last_login_at else None
        return {
            "name": f"{first_name or ''} {last_name or ''}".strip(),
            "email": email,
            "role": role,
            "company": company or "",
            "phone_number": phone_number or "",
            "last_login_at": login_str,
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.put("/profile/update")
def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    role = current_user["role"]

    parts = data.name.strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ? AND deleted_at IS NULL",
            (first_name, last_name, user_id),
        )

        if role == "org_admin" and data.company:
            cur.execute(
                """
                UPDATE organizations SET name = ?
                WHERE org_id = (SELECT org_id FROM users WHERE user_id = ?)
                """,
                (data.company.strip(), user_id),
            )

        conn.commit()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.put("/profile/password")
def update_password(data: PasswordUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT password_hash FROM users WHERE user_id = ? AND deleted_at IS NULL",
            (user_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        if not pwd_context.verify(data.current_password, row[0]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        if len(data.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

        new_hash = pwd_context.hash(data.new_password)
        cur.execute(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            (new_hash, user_id),
        )
        conn.commit()
        return {"message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.delete("/sessions")
def revoke_all_sessions(request: Request, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    # Keep the current session alive — only revoke all others
    auth_header = request.headers.get("Authorization", "")
    current_token = auth_header.removeprefix("Bearer ").strip()

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if current_token:
            # Hash the refresh token isn't available here, so invalidate all sessions
            # The client will handle re-auth via the refresh cookie after this call
            cur.execute(
                "UPDATE user_sessions SET is_valid = 0 WHERE user_id = ?",
                (user_id,),
            )
        else:
            cur.execute(
                "UPDATE user_sessions SET is_valid = 0 WHERE user_id = ?",
                (user_id,),
            )
        conn.commit()
        return {"message": "All sessions signed out"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
