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
    
    # Debug print (remove after it works)
    print(f"Server: {server}")
    print(f"Database: {database}")
    print(f"Username: {username}")
    
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
        connection = pyodbc.connect(conn_str)
        print("Connected successfully!")
        return connection
    except Exception as e:
        print(f"Connection error: {e}")
        raise