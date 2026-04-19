const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, 'src/dashboard/peternak');
const DIRS = ['sapi', 'kambing', 'domba', 'kambing_domba'];

const ICON_MAP = [
    { 
        emoji: 'ðŸ’‰', 
        name: 'Syringe',
        wrapper: (color) => `<div className="w-16 h-16 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-4">
          <Syringe size={32} className="text-${color}-500" />
        </div>`
    },
    { 
        emoji: 'ðŸ’Š', 
        name: 'Pill',
        wrapper: (color) => `<div className="w-16 h-16 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-4">
          <Pill size={32} className="text-${color}-500" />
        </div>`
    },
    { 
        emoji: 'ðŸ“Š', 
        name: 'BarChart3',
        wrapper: (color) => `<div className="w-16 h-16 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={32} className="text-${color}-500" />
        </div>`
    },
    { 
        emoji: 'ðŸ“‹', 
        name: 'ClipboardList',
        wrapper: (color) => `<div className="w-16 h-16 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-4">
          <ClipboardList size={32} className="text-${color}-500" />
        </div>`
    },
    { 
        emoji: 'ðŸŒ¾', 
        name: 'Wheat',
        wrapper: (color) => `<div className="w-16 h-16 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-4">
          <Wheat size={32} className="text-${color}-500" />
        </div>`
    },
    { 
        emoji: /ðŸ „|ðŸ  |ðŸ ‘|ðŸ ‚|ðŸ ®/, 
        name: 'LayoutGrid',
        wrapper: (color) => `<div className="w-16 h-16 rounded-3xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mx-auto mb-4">
          <LayoutGrid size={32} className="text-${color}-500" />
        </div>`
    }
];

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    let color = (filePath.includes('sapi') || filePath.includes('Sapi')) ? 'amber' : 'green';

    // 1. Fix Empty State Wrappers
    ICON_MAP.forEach(item => {
        const tagRegex = new RegExp(`<(p|span) className="[^"]*">(${item.emoji instanceof RegExp ? item.emoji.source : item.emoji})<\\/\\1>`, 'g');
        if (content.match(tagRegex)) {
            content = content.replace(tagRegex, item.wrapper(color));
            changed = true;
        }
    });

    // 2. Fix Checkmarks and Crosses (using Lucide)
    if (content.includes('âœ…') || content.includes('â Œ')) {
        content = content.replace(/'âœ…'/g, '<CheckCircle2 size={16} className="text-green-400" />')
                         .replace(/"âœ…"/g, '<CheckCircle2 size={16} className="text-green-400" />')
                         .replace(/'â Œ'/g, '<XCircle size={16} className="text-red-400" />')
                         .replace(/"â Œ"/g, '<XCircle size={16} className="text-red-400" />');
        changed = true;
    }

    // 3. Clean Species Labels (remove emoji from strings)
    const speciesCleanup = [
        { emoji: 'ðŸ  ', replace: '' },
        { emoji: 'ðŸ ‘', replace: '' },
        { emoji: 'ðŸ   Kambing', replace: 'Kambing' },
        { emoji: 'ðŸ ‘ Domba', replace: 'Domba' }
    ];
    speciesCleanup.forEach(s => {
        const regex = new RegExp(s.emoji, 'g');
        if (content.match(regex)) {
            content = content.replace(regex, s.replace);
            changed = true;
        }
    });

    // 4. Update imports if needed
    if (changed) {
        const requiredIcons = [];
        if (content.includes('<CheckCircle2')) requiredIcons.push('CheckCircle2');
        if (content.includes('<XCircle')) requiredIcons.push('XCircle');
        ICON_MAP.forEach(item => {
            if (content.includes(`<${item.name}`)) requiredIcons.push(item.name);
        });

        if (requiredIcons.length > 0) {
            content = content.replace(/import {([^}]*)} from 'lucide-react'/, (match, p1) => {
                let imports = p1.split(',').map(i => i.trim());
                requiredIcons.forEach(icon => {
                    if (!imports.includes(icon)) imports.push(icon);
                });
                return `import { ${[...new Set(imports)].filter(Boolean).join(', ')} } from 'lucide-react'`;
            });
        }
        fs.writeFileSync(filePath, content);
        console.log(`FIXED: ${filePath}`);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (f.endsWith('.jsx')) {
            processFile(p);
        }
    });
}

DIRS.forEach(d => walk(path.join(ROOT, d)));
console.log('Cleanup complete.');
