const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'sections'),
  path.join(__dirname, 'src', 'components')
];

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
            // Check if it's a comment
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('{/*')) {
              // Ignore comments
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

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walk(dir);
  }
});

console.log(JSON.stringify(results, null, 2));
