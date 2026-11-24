@echo off
start "OmniDoc AI Backend" cmd /k "%~dp0run_backend.bat"
start "OmniDoc AI Frontend" cmd /k "%~dp0run_frontend.bat"
echo OmniDoc AI services started!
echo - Backend API:  http://localhost:8000 (Docs: http://localhost:8000/docs)
echo - Frontend UI:  http://localhost:5173
pause
