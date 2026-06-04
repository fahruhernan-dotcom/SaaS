const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const results = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(' — ')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(' — ')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('{/*')) {
              return;
            }
            results.push({
              file: path.relative(__dirname, fullPath),
              line: index + 1,
              content: trimmed
            });
          }
        });
      }
    }
  }
}

if (fs.existsSync(srcDir)) {
  walk(srcDir);
}

fs.writeFileSync(path.join(__dirname, 'find-dashes-all-out.json'), JSON.stringify(results, null, 2), 'utf8');
console.log(`Found ${results.length} occurrences.`);
