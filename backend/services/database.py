# Author: Bria Tran
# Date: November 30th, 2025
# Handles database connection to Azure SQL Database 
# using pyodbc and environment variables

import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

_pool: list[pyodbc.Connection] = []
_conn_str: str = ""

def _build_conn_str() -> str:
    driver   = os.getenv('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
    server   = os.getenv('DB_SERVER')
    database = os.getenv('DB_NAME')
    username = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')

    missing = [k for k, v in {'DB_SERVER': server, 'DB_NAME': database,
                               'DB_USER': username, 'DB_PASSWORD': password}.items() if not v]
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}. Check your .env file.")

    return (
        f"Driver={{{driver}}};"
        f"Server=tcp:{server},1433;"
        f"Database={database};"
        f"Uid={username};"
        f"Pwd={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )

def _new_connection() -> pyodbc.Connection:
    global _conn_str
    if not _conn_str:
        _conn_str = _build_conn_str()
    return pyodbc.connect(_conn_str)

def init_db(pool_size: int = 5) -> None:
    """Call once at startup to pre-open connections."""
    global _pool
    print("[DB] Connecting to Azure SQL Database...")
    _pool = [_new_connection() for _ in range(pool_size)]
    print(f"[DB] Pool ready ({pool_size} connections).")

def get_db_connection() -> pyodbc.Connection:
    """Return a live connection from the pool, replacing it if it has gone stale."""
    global _pool
    if not _pool:
        # pool not initialised — fall back to a single connection
        return _new_connection()

    conn = _pool.pop()
    try:
        conn.cursor().execute("SELECT 1")   # lightweight liveness check
    except Exception:
        conn = _new_connection()            # replace dead connection silently
    return conn

def release_connection(conn: pyodbc.Connection) -> None:
    """Return a connection to the pool after use."""
    _pool.append(conn)