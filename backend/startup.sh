#!/bin/bash
set -e

# Install ODBC Driver 18 for SQL Server
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - 2>/dev/null
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
apt-get update -qq
ACCEPT_EULA=Y apt-get install -y -qq msodbcsql18 unixodbc-dev

# Start the app
gunicorn -w 2 -k uvicorn.workers.UvicornWorker --timeout 120 --bind 0.0.0.0:8000 main:app
