@echo off
chcp 65001 >nul
echo ==============================================
echo       Enviando alteracoes para o GitHub...
echo ==============================================
echo.

:: Solicita a mensagem de commit
set /p msg="Digite a mensagem do commit (pressione Enter para usar 'Atualizacao automatica'): "

:: Se o usuario pressionar apenas Enter, define uma mensagem padrao
if "%msg%"=="" set msg=Atualizacao automatica

echo.
echo [1/3] Adicionando arquivos...
git add .

echo.
echo [2/3] Criando commit: "%msg%"...
git commit -m "%msg%"

echo.
echo [3/3] Enviando para o GitHub (branch master)...
git push origin master

echo.
echo ==============================================
echo      Processo concluido com sucesso!
echo ==============================================
pause
