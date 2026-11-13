@echo off
chcp 65001 >nul
cd /d "%~dp0"
node tools\keygen.js init
echo.
echo IMPORTANTE: haz una copia de seguridad de keys\private.pem (si la pierdes no podras emitir mas licencias).
pause
