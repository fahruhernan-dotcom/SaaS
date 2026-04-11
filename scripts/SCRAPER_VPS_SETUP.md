# TernakOS Market Price Scraper - VPS Setup Guide

Since you are using a VPS, the best way to handle daily price updates is via a **Cron Job**. This ensures the data is always fresh without manual intervention.

## 1. Prerequisites
Ensure your VPS has Python 3 and the necessary libraries installed:
```bash
# Navigate to the project directory
cd /path/to/Ternak-OS

# Install dependencies
pip install requests beautifulsoup4 python-dotenv schedule
```

## 2. Setting Up the Cron Job
We recommend running the scraper **twice a day** (around 07:00 and 13:00 WIB) to capture the morning update and any midday corrections from Chickin.id.

1. Open your crontab editor:
   ```bash
   crontab -e
   ```

2. Add the following lines (adjust paths accordingly):
   ```bash
   # Scrape at 07:00 WIB
   0 7 * * * /usr/bin/python3 /path/to/Ternak-OS/scripts/ternakos_harga_scraper.py >> /path/to/Ternak-OS/scripts/scraper.log 2>&1

   # Scrape at 13:00 WIB
   0 13 * * * /usr/bin/python3 /path/to/Ternak-OS/scripts/ternakos_harga_scraper.py >> /path/to/Ternak-OS/scripts/scraper.log 2>&1
   ```

## 3. Manual Scraper Trigger
You can also trigger a manual scrape directly using the npm script I added:
```bash
npm run scrape:market
```

## 4. Verification
Check the `scripts/scraper.log` file to verify that the cron jobs are running successfully:
```bash
tail -f scripts/scraper.log
```

---
**Note:** Ensure your `.env` file in the project root contains the correct `SUPABASE_SERVICE_KEY` and `SUPABASE_URL`.
