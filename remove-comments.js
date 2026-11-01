const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') walk(p);
    } else if (p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.html')) {
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(//g, '')
           .replace(/\/\*[\s\S]*?\*\//g, '')
           .replace(/^\s*\/\/.*$/gm, '');
      fs.writeFileSync(p, c);
    }
  });
}

walk('.');
console.log('✅ Comments removed from JS, CSS, and HTML files!');