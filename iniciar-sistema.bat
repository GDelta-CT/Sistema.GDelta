@echo off
title GDelta - Sistema (deixe esta janela aberta)
cd /d "C:\Users\Eliel\dev\Sistema-GDelta"
echo ==================================================
echo   GDelta - iniciando o Sistema...
echo.
echo   DEIXE ESTA JANELA ABERTA enquanto usa o sistema.
echo   O navegador abre sozinho em ~15 segundos.
echo   Para parar: feche esta janela.
echo ==================================================
echo.
start "" cmd /c "timeout /t 15 >nul & start "" http://localhost:3000"
call npm run dev
echo.
echo (O servidor parou. Feche a janela ou rode de novo.)
pause
