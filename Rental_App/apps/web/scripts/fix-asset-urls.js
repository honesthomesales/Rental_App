const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'out');

function fixHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  
  html = html.replace(/(href|src)="(?<!\/)Rental_App\/_next\//g, '$1="/Rental_App/_next/');
  html = html.replace(/(href|src)="(\.\/)?_next\//g, '$1="/Rental_App/_next/');
  html = html.replace(/(href|src)="\/Rental_App\/Rental_App\/_next\//g, '$1="/Rental_App/_next/');
  
  fs.writeFileSync(file, html);
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    
    if (s.isDirectory()) {
      walk(p);
    } else if (name.endsWith('.html')) {
      fixHtml(p);
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error('Missing export dir:', OUT);
  process.exit(1);
}

walk(OUT);
console.log('HTML asset URLs sanitized.');
