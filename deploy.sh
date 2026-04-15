#!/bin/bash
set -e

echo "==> Pull latest code..."
cd ~/ternakos || exit 1
git pull origin main

echo "==> Install dependencies..."
npm install --legacy-peer-deps

echo "==> Install Python dependencies..."
# If using venv (recommended)
if [ -d ".venv" ]; then
    ./.venv/bin/pip install -r scripts/requirements.txt
else
    pip3 install -r scripts/requirements.txt
fi

echo "==> Scraping all market prices (Chickin & Arboge)..."
npm run scrape:all

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
