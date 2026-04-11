#!/bin/bash
set -e

echo "==> Pull latest code..."
cd ~/ternakos || exit 1
git pull origin main

echo "==> Install dependencies..."
npm install --legacy-peer-deps

echo "==> Scraping market prices..."
npm run scrape:market

echo "==> Generating sitemap..."
npm run sitemap

echo "==> Build..."
npm run build

echo "==> Reload Nginx..."
sudo systemctl reload nginx

echo ""
echo "Deploy selesai!"
