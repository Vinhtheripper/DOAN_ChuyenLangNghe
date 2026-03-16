# Script push ChuyenLangNghe len GitHub - nhanh 2
Set-Location $PSScriptRoot

Write-Host "1. Dang them file..." -ForegroundColor Cyan
git add .

Write-Host "2. Dang tao commit..." -ForegroundColor Cyan
git commit -m "Initial commit - Chuyen Lang Nghe"

Write-Host "3. Tao va chuyen sang nhanh 2..." -ForegroundColor Cyan
git checkout -b 2

Write-Host "4. Push len GitHub..." -ForegroundColor Cyan
git push -u origin 2

Write-Host "Xong! Kiem tra tai: https://github.com/tanminz/ChuyenLangNghe" -ForegroundColor Green
