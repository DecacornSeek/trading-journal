@echo off
title TradeLog — NCI Trading Journal
cd /d "%~dp0"
echo.
echo  =============================================
echo    TradeLog ^— NCI Trading Journal
echo  =============================================
echo.
echo  Starting local server...
echo  Your browser will open automatically.
echo.
echo  Keep this window open while using the app.
echo  Close this window to shut down.
echo.
npm run dev
