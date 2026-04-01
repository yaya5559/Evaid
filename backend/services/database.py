# Author: Bria Tran
# Date: November 30th, 2025
# Handles database connection to Azure SQL Database 
# using pyodbc and environment variables

import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

# Connects to Azure SQL Database
def get_db_connection():
    # gets driver from env file
    driver = os.getenv('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
    server = os.getenv('DB_SERVER')
    database = os.getenv('DB_NAME')
    username = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    
    # Validate environment variables are set
    missing_vars = []
    if not server:
        missing_vars.append('DB_SERVER')
    if not database:
        missing_vars.append('DB_NAME')
    if not username:
        missing_vars.append('DB_USER')
    if not password:
        missing_vars.append('DB_PASSWORD')
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}. Check your .env file.")
    
    # builds connection string from env. required for Azure SQL Database
    conn_str = (
        f"Driver={{{driver}}};"
        f"Server=tcp:{server},1433;"  
        f"Database={database};"
        f"Uid={username};"
        f"Pwd={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )
    
    # added try/catch to see what error i'm getting
    try:
        print("[DB] Attempting to connect to Azure SQL Database...")
        connection = pyodbc.connect(conn_str)
        print("[DB] Connected successfully!")
        return connection
    except pyodbc.Error as e:
        print(f"[DB] Connection error: {e}")
        print(f"[DB] Error code: {e.args[0] if e.args else 'Unknown'}")
        raise
    except Exception as e:
        print(f"[DB] Unexpected error: {type(e).__name__}: {e}")
        raise

