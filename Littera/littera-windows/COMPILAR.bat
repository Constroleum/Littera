@echo off
chcp 65001 >nul
title Compilar Littera
cd /d "%~dp0"
if not exist package.json (
  echo ERROR: No encuentro los archivos de Littera.
  echo Primero EXTRAE el zip completo: clic derecho ^> "Extraer todo..." o "Extraer aqui",
  echo y ejecuta COMPILAR.bat desde la carpeta extraida, no desde dentro del zip.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas instalar Node.js LTS desde https://nodejs.org y volver a ejecutar esto.
  pause
  exit /b 1
)
if not exist build\public.pem (
  echo Creando tus claves de licencia por primera vez...
  node tools\keygen.js init
)
echo Instalando dependencias (puede tardar unos minutos)...
call npm install
if errorlevel 1 goto fallo
set CSC_IDENTITY_AUTO_DISCOVERY=false
echo Creando el programa...
call npm run dist
if not exist "dist\Littera-Instalador-2.3.0.exe" goto fallo
echo.
echo LISTO. Tus programas estan en la carpeta "dist":
echo   Littera-Instalador-2.3.0.exe  y  Littera-Portable-2.3.0.exe
start "" dist
pause
exit /b 0
:fallo
echo.
echo Algo ha fallado. Si habla de "symbolic link", activa el Modo de desarrollador de Windows y reintenta.
pause
