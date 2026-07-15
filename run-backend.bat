@echo off
title Decision Replay Backend
echo ===================================================
echo Starting Expert Decision Replay Platform Backend...
echo ===================================================
cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing requirements...
pip install -r requirements.txt

echo Starting Uvicorn API server on http://localhost:5000...
uvicorn app.main:app --reload --port 5000

pause
