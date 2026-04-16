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

echo "==> Patching Nginx Fallback..."
sudo sed -i -E 's/try_files \$uri \$uri\/ \/index\.html(.*?);/try_files \$uri \$uri\/ \/200.html\1;/g' /etc/nginx/sites-enabled/* || true

echo "==> Reload Nginx..."
sudo systemctl reload nginx

echo ""
echo "Deploy selesai!"
