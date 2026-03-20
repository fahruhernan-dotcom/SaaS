#!/bin/bash
cd /path/to/project
source .env
python scripts/ternakos_harga_scraper.py --daemon >> /var/log/ternakos_scraper.log 2>&1 &
echo "Scraper daemon started (PID: $!)"
