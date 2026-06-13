@echo off
chcp 65001 >nul

set PROJECT=D:\Windows\GreenSweet\小本本备份\抒情簿AI_Project

echo ================================
echo  转换 Excel → entries.json
echo ================================

python "%PROJECT%\scripts\export_json.py"
if errorlevel 1 (
    echo [失败] 请检查 scripts\export_json.py 是否有误
    pause
    exit /b 1
)
echo [完成] entries.json 已更新
pause
