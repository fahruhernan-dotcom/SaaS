const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('find-dashes-all-out.json', 'utf8'));

const publicFiles = [
  'src/pages/AboutUs.jsx',
  'src/pages/FAQPage.jsx',
  'src/pages/LandingPage.jsx',
  'src/pages/Login.jsx',
  'src/pages/NotFound.jsx',
  'src/pages/SecurityPage.jsx',
  'src/pages/TermsPage.jsx',
  'src/pages/HargaPasarPublic.jsx',
  'src/pages/harga/',
  'src/pages/fitur/',
  'src/sections/'
];

const results = data.filter(item => {
  const normalizedFile = item.file.replace(/\\/g, '/');
  return publicFiles.some(pf => normalizedFile.startsWith(pf));
});

console.log(`Filtered down to ${results.length} public landing page matches.`);
fs.writeFileSync('public-targets.json', JSON.stringify(results, null, 2), 'utf8');
