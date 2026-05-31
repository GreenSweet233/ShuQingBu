@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ================================
echo  抒情簿 - 本地调试服务器
echo ================================
echo.

:: 先转换 Excel → JSON
echo [1/3] 转换 Excel → entries.json ...
python export_json.py
echo.

:: 获取本机局域网 IP (兼容中英文系统)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 地址"') do set MYIP=%%a
if "%MYIP%"=="" for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "192\.168\."') do set MYIP=%%a
set MYIP=%MYIP: =%

:: 检查端口
set PORT=8080
netstat -ano | findstr ":8080 " >nul 2>&1
if not errorlevel 1 (
    echo [!] 端口 8080 已被占用，改用 8081
    set PORT=8081
)

echo [2/3] 启动服务器 (按 Ctrl+C 停止)
echo.
echo   本地:  http://localhost:%PORT%
echo   手机:  http://%MYIP%:%PORT%
echo.
echo [3/3] 打开浏览器...
start http://localhost:%PORT%

python -m http.server %PORT% --directory "%~dp0"
echo.
pause
