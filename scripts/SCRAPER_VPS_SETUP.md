# TernakOS Market Price Scraper - VPS Setup Guide

Since you are using a VPS, the best way to handle daily price updates is via **systemd Services** (for daemon/background mode) or **Cron Jobs**.

## 1. Prerequisites
Ensure your VPS has Python 3 and the necessary libraries installed:
```bash
# Navigate to the project directory
cd ~/ternakos

# Setup venv (Recommended)
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

## 2. Setting Up Service Daemons (Recommended)
This runs the scrapers in the background and automatically retries if they fail.

1. **Copy service files**:
   ```bash
   sudo cp scripts/ternakos-scraper.service /etc/systemd/system/
   sudo cp scripts/arboge-scraper.service /etc/systemd/system/
   ```

2. **Enable and Start**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable ternakos-scraper
   sudo systemctl enable arboge-scraper
   sudo systemctl start ternakos-scraper
   sudo systemctl start arboge-scraper
   ```

3. **Check Status**:
   ```bash
   sudo systemctl status ternakos-scraper
   sudo systemctl status arboge-scraper
   ```

## 3. Alternative: Setting Up Cron Jobs
If you prefer standard cron (runs only every 3 hours):
```bash
# Scrape every 3 hours (00:00, 03:00, 06:00, dst)
0 */3 * * * ~/ternakos/.venv/bin/python ~/ternakos/scripts/ternakos_harga_scraper.py >> ~/ternakos/scripts/scraper.log 2>&1
0 */3 * * * ~/ternakos/.venv/bin/python ~/ternakos/scripts/arboge_scraper.py >> ~/ternakos/scripts/arboge.log 2>&1
```

## 4. Verification
Check the logs to verify updates:
```bash
tail -f scripts/arboge_scraper.log
```

---
**Note:** Ensure your `.env` file in the project root contains the correct `SUPABASE_SERVICE_KEY` and `SUPABASE_URL`.

