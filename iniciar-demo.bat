@echo off
title GDelta - MODO DEMONSTRACAO (apresentacao a investidor)
cd /d "C:\Users\Eliel\dev\Sistema-GDelta"
set NEXT_PUBLIC_DEMO=1
echo ==================================================
echo   GDelta - MODO DEMONSTRACAO
echo.
echo   Dados ficticios, sem login, sem banco.
echo   DEIXE ESTA JANELA ABERTA durante a apresentacao.
echo   O navegador abre sozinho em ~18 segundos no painel.
echo   Para parar: feche esta janela.
echo ==================================================
echo.
start "" cmd /c "timeout /t 18 >nul & start "" http://localhost:3000/painel"
call npm run dev
echo.
echo (O servidor parou. Feche a janela ou rode de novo.)
pause
