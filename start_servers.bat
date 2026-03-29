@echo off
echo Starting Frontend Server...
start "Frontend Server" /d "c:\Users\kudch\Downloads\ask-markov-ai" cmd /k "npm run dev"

echo Starting Backend Server...
start "Backend Server" /d "c:\Users\kudch\Downloads\ask-markov-ai\backend" cmd /k "venv\Scripts\python -m uvicorn main:app --reload --port 8000"

echo Both servers have been started in new windows.
