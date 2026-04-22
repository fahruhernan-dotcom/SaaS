import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script untuk generate sitemap.xml otomatis.
 * Menjalankan script ini akan menghasilkan file public/sitemap.xml
 */

const BASE_URL = 'https://ternakos.my.id';

// Daftar Provinsi (Copied from src/lib/constants/regions.js logic)
const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", 
  "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
  "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Tengah", "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"
];

function provinceToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

const staticRoutes = [
  '',
  '/harga-pasar',
  '/market',
  '/fitur',
  '/harga',
  '/tentang-kami',
  '/hubungi-kami',
  '/blog',
  '/faq',
  '/terms',
  '/privacy',
];

// Blog article slugs — keep in sync with src/data/blogPosts.js
const BLOG_SLUGS = [
  'cara-hitung-fcr-ayam-broiler',
  'cara-hitung-indeks-performa-ayam-broiler',
  'cara-mengurangi-angka-kematian-ayam-broiler',
  'tips-manajemen-kandang-ayam-broiler-pemula',
  'cara-hitung-keuntungan-peternak-ayam-broiler',
];

function generateSitemap() {
  const lastMod = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static Routes
  staticRoutes.forEach(route => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${route}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 2. Dynamic Province Routes
  PROVINCES.forEach(prov => {
    const slug = provinceToSlug(prov);
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/harga-pasar/${slug}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  });

  // 3. Blog Article Route
  BLOG_SLUGS.forEach(slug => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/blog/${slug}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('✅ Success: public/sitemap.xml has been generated!');
}

generateSitemap();
