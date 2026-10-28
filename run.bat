@echo off
setlocal enabledelayedexpansion
title BrandForge Free - Kurulum ve Calistirma
cd /d "%~dp0"

echo.
echo  ==============================================================
echo     BrandForge Free  ^|  Limitsiz AI Logo Uretici
echo  ==============================================================
echo.

REM =========================================================
REM  1) Node.js kontrolu
REM =========================================================
where node >nul 2>nul
if errorlevel 1 (
  echo  [HATA] Node.js bulunamadi.
  echo.
  echo    Lutfen Node.js 20.19+ ^(veya 22.12+^) kurun:
  echo    https://nodejs.org  adresinden "LTS" surumunu indirin.
  echo    Kurulum bitince bu dosyayi tekrar calistirin.
  echo.
  pause
  exit /b 1
)

node -e "const[a,b]=process.versions.node.split('.').map(Number);process.exit((a>20||(a===20&&b>=19))?0:1)"
if errorlevel 1 (
  echo  [HATA] Node.js surumu eski:
  node -v
  echo    Gereken surum: 20.19.0 veya uzeri ^(22.12+ daha iyi^)
  echo    https://nodejs.org adresinden guncelleyin.
  echo.
  pause
  exit /b 1
)

echo  [OK] Node.js kurulu: 
node -v

where npm >nul 2>nul
if errorlevel 1 (
  echo  [HATA] npm bulunamadi. Node.js'i yeniden kurun ^(npm ile birlikte gelir^).
  pause
  exit /b 1
)

REM =========================================================
REM  2) Bagimliliklar
REM =========================================================
echo.
if exist "node_modules\vite" (
  echo  [*] Bagimliliklar zaten kurulu, kontrol ediliyor...
) else (
  echo  [*] Bagimliliklar kuruluyor ^(1-3 dakika, internet gerekir^)...
)
echo.

call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo  [HATA] Bagimliliklar kurulamadi.
  echo    Internet baglantinizi kontrol edip tekrar deneyin.
  echo    Manuel deneme:  npm cache clean --force   sonra   npm install
  echo.
  pause
  exit /b 1
)
echo.
echo  [OK] Bagimliliklar hazir.

REM =========================================================
REM  3) Bos port bul
REM =========================================================
set PORT=5173
:portloop
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT+=1
  if !PORT! lss 5190 goto portloop
)
echo  [OK] Kullanilacak port: %PORT%

REM =========================================================
REM  4) Menu
REM =========================================================
echo.
echo  --------------------------------------------------------------
echo    1^) Gelistirme modu  -  tarayicida canli calisir  ^(onerilen^)
echo    2^) Uretim modu     -  dist/ klasorunu hazirlar
echo    3^) Sadece kurulum   -  bagimliliklari kurar ve cikar
echo  --------------------------------------------------------------
set CHOICE=
set /p "CHOICE=  Seciminiz [1]: "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="3" (
  echo.
  echo  [OK] Kurulum tamamlandi. Artik "npm run dev" yazarak calistirabilirsiniz.
  pause
  exit /b 0
)

if "%CHOICE%"=="2" goto production

REM =========================================================
REM  5) Gelistirme modu
REM =========================================================
echo.
echo  ==============================================================
echo    Sunucu baslatiliyor:  http://localhost:%PORT%
echo.
echo    * Ucretsiz AI gorseller icin sayfada "Ucretsiz giris yap"
echo      butonuna basin (Puter hesabi - ucretsiz).
echo    * Bu pencereyi kapatmak sunucuyu durdurur.
echo  ==============================================================
echo.

start "BrandForge Free - Sunucu" cmd /k "npm run dev -- --port %PORT%"
timeout /t 4 /nobreak >nul
start "" "http://localhost:%PORT%"

echo  [OK] Tarayici acildi. Sunucu penceresini acik birakin.
echo.
pause
exit /b 0

REM =========================================================
REM  6) Uretim modu
REM =========================================================
:production
echo.
echo  [*] Uretim derlemesi yapiliyor...
call npm run build
if errorlevel 1 (
  echo  [HATA] Derleme basarisiz oldu.
  pause
  exit /b 1
)
echo.
echo  [OK] dist/ klasoru hazir.
echo.
echo    dist/ klasorunu Netlify / Vercel / Cloudflare Pages'a
echo    yukleyebilirsiniz. Backend gerekmez, her sey tarayicida calisir.
echo.
pause
exit /b 0
