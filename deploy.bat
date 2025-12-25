@echo off
echo ===================================================
echo   DANG DONG BO DU LIEU LEN GITHUB...
echo ===================================================

:: 1. Kiem tra xem da co Git chua
if not exist ".git" (
    echo [INFO] Chua cau hinh Git. Dang khoi tao...
    git init
    git branch -M main
    git remote add origin https://github.com/dung2686-hub/website-mrcharlie.git
    echo [INFO] Da cau hinh xong Remote Origin.
)

:: 1.5. Cau hinh Nguoi Dung (De khong bi loi "Author identity unknown")
git config user.email "admin@mrcharlie.ai"
git config user.name "MrCharlie Admin"

:: 2. Thuc hien cac lenh Git
git add .
git commit -m "Update site data and config"

:: 3. Day len GitHub (Force push de dam bao Local la nhat)
echo [INFO] Dang day code len GitHub...
git push -u origin main --force

echo.
echo ===================================================
echo   DA XONG!
echo   Vui long doi 1-2 phut de Website/Admin cap nhat.
echo ===================================================
pause
