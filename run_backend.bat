@echo off
cd /d "%~dp0backend"
set PATH=%LOCALAPPDATA%\Programs\Tesseract-OCR;%PATH%
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 8000
