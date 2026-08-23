@echo off
cd /d "%~dp0.."
start "Guide Review Server" /min cmd /c "npm run review:web"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5679"
