#!/bin/bash
set -e

echo "==> Pull latest code..."
git -C ~/ternakos pull origin main

echo "==> Install dependencies..."
npm --prefix ~/ternakos install --legacy-peer-deps

echo "==> Build..."
npm --prefix ~/ternakos run build

echo "==> Reload Nginx..."
sudo systemctl reload nginx

echo ""
echo "Deploy selesai!"
