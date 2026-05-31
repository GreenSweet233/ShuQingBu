@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================
echo  抒情簿 - 本地调试服务器
echo ================================

:: 检查 entries.json 是否存在
if not exist "entries.json" (
    echo [警告] 未找到 entries.json，请先运行 export.bat
)

:: 获取本机局域网 IP (兼容中英文系统)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 地址"') do set MYIP=%%a
if "%MYIP%"=="" for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "192\.168\."') do set MYIP=%%a
set MYIP=%MYIP: =%

:: 检查端口
set PORT=8080
netstat -ano | findstr ":8080 " >nul 2>&1
if not errorlevel 1 (
    set PORT=8081
)

echo.
echo  本地:  http://localhost:%PORT%
echo  手机:  http://%MYIP%:%PORT%
echo   (手机需连接同一 WiFi)
echo.
echo  按 Ctrl+C 停止服务器
echo.
start http://localhost:%PORT%

python -m http.server %PORT% --directory "%~dp0"
pause
