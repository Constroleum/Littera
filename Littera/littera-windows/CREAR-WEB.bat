@echo off
chcp 65001 >nul
title Crear Littera para iPad (web)
cd /d "%~dp0"
if not exist package.json (
  echo Extrae primero el zip completo y ejecuta esto desde la carpeta extraida.
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas Node.js LTS: https://nodejs.org
  pause
  exit /b 1
)
if not exist build\public.pem (
  echo Falta build\public.pem: ejecuta primero COMPILAR.bat una vez ^(crea tus claves de licencia^).
  pause
  exit /b 1
)
if not exist node_modules call npm install
if errorlevel 1 goto fallo
node tools\build_pwa.js
if errorlevel 1 goto fallo
echo.
echo LISTO. Sube el CONTENIDO de la carpeta "pwa-dist" a tu hosting con HTTPS. Lee IPAD-LEEME.txt
start "" pwa-dist
pause
exit /b 0
:fallo
echo Algo ha fallado.
pause
