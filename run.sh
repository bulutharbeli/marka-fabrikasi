#!/usr/bin/env bash
# BrandForge Free — tek komutla kurulum ve calistirma (macOS / Linux)
set -euo pipefail
cd "$(dirname "$0")"

BLUE='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo " =============================================================="
echo "   BrandForge Free  |  Limitsiz AI Logo Uretici"
echo " =============================================================="
echo ""

# --- Node.js kontrolu ---
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[HATA] Node.js bulunamadi.${NC}"
  echo "  https://nodejs.org adresinden Node 20.19+ (22.12+ onerilir) kurun."
  exit 1
fi

if ! node -e "const[a,b]=process.versions.node.split('.').map(Number);process.exit((a>20||(a===20&&b>=19))?0:1)"; then
  echo -e "${RED}[HATA] Node.js surumu eski: $(node -v)${NC}"
  echo "  Gereken: 20.19.0+ (22.12+ daha iyi). nvm ile: nvm install 22 && nvm use 22"
  exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js $(node -v)"
command -v npm >/dev/null 2>&1 || { echo -e "${RED}[HATA] npm bulunamadi.${NC}"; exit 1; }

# --- Bagimliliklar ---
if [ -d node_modules/vite ]; then
  echo -e "${YELLOW}[*]${NC} Bagimliliklar zaten kurulu, kontrol ediliyor..."
else
  echo -e "${YELLOW}[*]${NC} Bagimliliklar kuruluyor (1-3 dakika)..."
fi
echo ""
npm install --no-audit --no-fund
echo -e "${GREEN}[OK]${NC} Bagimliliklar hazir."

# --- Bos port bul ---
PORT=5173
while lsof -i ":$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  [ "$PORT" -ge 5190 ] && { echo -e "${RED}[HATA] Bos port bulunamadi.${NC}"; exit 1; }
done
echo -e "${GREEN}[OK]${NC} Port: $PORT"

# --- Menu ---
echo ""
echo " --------------------------------------------------------------"
echo "   1) Gelistirme modu  -  tarayicida canli calisir (onerilen)"
echo "   2) Uretim modu     -  dist/ klasorunu hazirlar"
echo "   3) Sadece kurulum   -  bagimliliklari kurar ve cikar"
echo " --------------------------------------------------------------"
CHOICE="${1:-1}"
if [ "$CHOICE" = "3" ]; then
  echo -e "${GREEN}[OK]${NC} Kurulum tamamlandi. 'npm run dev' ile calistirin."
  exit 0
fi

if [ "$CHOICE" = "2" ]; then
  echo ""
  npm run build
  echo -e "${GREEN}[OK]${NC} dist/ hazir - Netlify / Vercel / Cloudflare Pages'a yukleyin."
  exit 0
fi

echo ""
echo " =============================================================="
echo "   Sunucu: http://localhost:$PORT"
echo "   * Sayfada 'Ucretsiz giris yap' ile Puter hesabi acin (ucretsiz)."
echo "   * Ctrl+C ile durdurun."
echo " =============================================================="
echo ""

( sleep 3; (command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT") || \
  (command -v open >/dev/null && open "http://localhost:$PORT") || true ) &

exec npm run dev -- --port "$PORT"
