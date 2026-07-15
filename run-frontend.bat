@echo off
title Decision Replay Frontend
echo ===================================================
echo Starting Expert Decision Replay Platform Frontend...
echo ===================================================
cd frontend

if not exist node_modules (
    echo Installing node dependencies...
    npm install
)

echo Starting Vite development server on http://localhost:5173...
npm run dev

pause
