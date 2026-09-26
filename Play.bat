@echo off
rem Double-click to play: starts the local server and opens the game in your browser.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Battle Scissors needs Node.js to run its little local server.
  echo Install it from https://nodejs.org, then double-click Play.bat again.
  pause
  exit /b 1
)
title Battle Scissors server
node tools\serve.js 8000 --open
pause
