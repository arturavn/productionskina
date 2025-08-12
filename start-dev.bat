@echo off
echo Iniciando Skina Ecopecas - Desenvolvimento
echo.

echo Instalando dependencias do backend...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias do backend
    pause
    exit /b 1
)

echo.
echo Iniciando servidor backend...
start "Backend" cmd /k "npm run dev"

echo Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo Voltando para o diretorio raiz...
cd ..

echo.
echo Instalando dependencias do frontend...
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias do frontend
    pause
    exit /b 1
)

echo.
echo Iniciando servidor frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Skina Ecopecas - Servidores Iniciados
echo ========================================
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:3001
echo  API Docs: http://localhost:3001/api/health
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul