const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /(from\s+['"])([\.\/]+)(.*?)(['"])/g;
      const newContent = content.replace(regex, (match, p1, p2, p3, p4) => {
        if (!p2.includes('..')) return match;
        
        // p2 is something like '../../../'
        const absoluteImportPath = path.resolve(path.dirname(fullPath), p2, p3);
        
        // Only replace if it points inside src
        const srcPath = path.resolve(__dirname, 'src');
        if (absoluteImportPath.startsWith(srcPath)) {
          const aliasPath = '@/'+ absoluteImportPath.slice(srcPath.length + 1).replace(/\\/g, '/');
          return p1 + aliasPath + p4;
        }
        return match;
      });
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir(path.resolve(__dirname, 'src/dashboard/peternak'));
