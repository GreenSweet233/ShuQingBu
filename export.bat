@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================
echo  转换 Excel → entries.json
echo ================================
python export_json.py
if errorlevel 1 (
    echo [失败] 请检查 export_json.py 是否有误
    pause
    exit /b 1
)
echo [完成] entries.json 已更新
pause
