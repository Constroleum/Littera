@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p NOMBRE=Nombre del cliente: 
set /p EMAIL=Email del cliente: 
node tools\keygen.js make "%NOMBRE%" "%EMAIL%"
echo (Tambien queda guardada en keys\licencias-emitidas.csv)
pause
