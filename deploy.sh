#!/bin/bash
set -e

echo "==> Pull latest code..."
cd ~/ternakos || exit 1
git pull origin main

echo "==> Install dependencies..."
npm install --legacy-peer-deps

echo "==> Install Python dependencies..."
if ! dpkg -s python3.12-venv &>/dev/null; then
    echo "    Installing python3.12-venv..."
    sudo apt install -y python3.12-venv
fi
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
./.venv/bin/pip install -q -r scripts/requirements.txt

echo "==> Install systemd services (if not registered)..."
for svc in scripts/ternakos-scraper.service scripts/arboge-scraper.service; do
    name=$(basename "$svc")
    if [ ! -f "/etc/systemd/system/$name" ]; then
        echo "    Registering $name..."
        sudo cp "$svc" /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable "${name%.service}"
    fi
done

echo "==> Scraping market prices (Chickin & Arboge)..."
./.venv/bin/python scripts/ternakos_harga_scraper.py || true
./.venv/bin/python scripts/arboge_scraper.py || true

echo "==> Restarting Scraper Daemons..."
sudo systemctl restart ternakos-scraper || true
sudo systemctl restart arboge-scraper || true

echo "==> Generating sitemap..."
npm run sitemap

echo "==> Build..."
npm run build

echo "==> Applying Nginx Hardening Config..."
if [ -f "nginx/ternakos.conf" ]; then
    sudo cp nginx/ternakos.conf /etc/nginx/sites-available/ternakos
    # Ensure it is linked
    if [ ! -f "/etc/nginx/sites-enabled/ternakos" ]; then
        sudo ln -s /etc/nginx/sites-available/ternakos /etc/nginx/sites-enabled/ternakos
    fi
    # Patch the 200.html fallback specifically in the target config
    sudo sed -i -E 's/try_files \$uri \$uri\/ \/index\.html(.*?);/try_files \$uri \$uri\/ \/200.html\1;/g' /etc/nginx/sites-available/ternakos || true
    echo "    Nginx config applied."
else
    echo "    Warning: nginx/ternakos.conf not found!"
fi

echo "==> Testing & Reloading Nginx..."
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "    Nginx reloaded successfully."
else
    echo "    ERROR: Nginx config test failed! Not reloading."
    exit 1
fi

# ── SEO: Ping Google & Bing sitemap ─────────────────────────────────────────
echo ""
echo "==> Pinging search engines with new sitemap..."
SITEMAP_URL="https://ternakos.my.id/sitemap.xml"

# Google
GOOGLE_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://www.google.com/ping?sitemap=${SITEMAP_URL}")
echo "    Google ping: HTTP $GOOGLE_RESP"

# Bing
BING_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://www.bing.com/ping?sitemap=${SITEMAP_URL}")
echo "    Bing ping:   HTTP $BING_RESP"

# Quick canonical check on key pages
# NOTE: react-helmet-async renders tags as:
#   <link data-rh="true" rel="canonical" href="...">
# So we search for 'canonical' (case-insensitive) anywhere in the HTML
echo ""
echo "==> Verifying canonical & title tags on key pages..."
PAGES=(
  "/"
  "/harga"
  "/fitur"
  "/tentang-kami"
  "/faq"
  "/blog"
  "/harga-pasar"
  "/market"
  "/terms"
  "/privacy"
)
ALL_OK=true
for path in "${PAGES[@]}"; do
  URL="https://ternakos.my.id${path}"
  HTML=$(curl -sL "$URL" 2>/dev/null)

  # react-helmet-async injects: <link data-rh="true" rel="canonical" href="...">
  CANONICAL=$(echo "$HTML" | grep -o 'rel="canonical"' | head -1)

  # react-helmet-async injects: <title data-rh="true">Title Here</title>
  # Since we removed hardcoded title from index.html, only Helmet title exists now
  TITLE=$(echo "$HTML" | grep -oP '(?<=<title data-rh="true">)[^<]+' | head -1)
  # Fallback: plain <title> without attribute
  if [ -z "$TITLE" ]; then
    TITLE=$(echo "$HTML" | grep -oP '(?<=<title>)[^<]+' | head -1)
  fi

  if [ -n "$CANONICAL" ]; then
    echo "    ✓ $URL"
    echo "      title: ${TITLE:-[MISSING - cek SEO component!]}"
  else
    echo "    ✗ MISSING canonical: $URL"
    echo "      title: ${TITLE:-[tidak ada]}"
    ALL_OK=false
  fi
done

echo ""
echo "======================================================"
if [ "$ALL_OK" = true ]; then
  echo " Deploy selesai! Semua halaman sudah ada canonical."
else
  echo " Deploy selesai! Cek halaman yang MISSING di atas."
  echo " CATATAN: 'MISSING' bisa false-positive jika server"
  echo " masih menyajikan cache lama. Tunggu 1-2 menit lalu"
  echo " cek langsung via Google Search Console 'Test Live URL'"
fi
echo "======================================================"
