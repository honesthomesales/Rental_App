const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'out');
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

function fixHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  
  if (isGitHubPages) {
    // Fix asset URLs for GitHub Pages deployment
    html = html.replace(/(href|src)="(?<!\/)My_Rental-App\/_next\//g, '$1="/My_Rental-App/_next/');
    html = html.replace(/(href|src)="(\.\/)?_next\//g, '$1="/My_Rental-App/_next/');
    html = html.replace(/(href|src)="\/My_Rental-App\/My_Rental-App\/_next\//g, '$1="/My_Rental-App/_next/');
  } else {
    // Fix asset URLs for local testing (remove base path)
    html = html.replace(/(href|src)="\/My_Rental-App\/_next\//g, '$1="/_next/');
    html = html.replace(/(href|src)="(\.\/)?_next\//g, '$1="/_next/');
  }
  
  fs.writeFileSync(file, html);
}

function fixJs(file) {
  let js = fs.readFileSync(file, 'utf8');
  
  if (isGitHubPages) {
    // Fix JavaScript asset URLs for GitHub Pages deployment
    js = js.replace(/(href|src)="(?<!\/)My_Rental-App\/_next\//g, '$1="/My_Rental-App/_next/');
    js = js.replace(/(href|src)="(\.\/)?_next\//g, '$1="/My_Rental-App/_next/');
  } else {
    // Fix JavaScript asset URLs for local testing (remove base path)
    js = js.replace(/\/My_Rental-App\/_next\//g, '/_next/');
    js = js.replace(/My_Rental-App\/_next\//g, '_next/');
  }
  
  fs.writeFileSync(file, js);
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    
    if (s.isDirectory()) {
      walk(p);
    } else if (name.endsWith('.html')) {
      fixHtml(p);
    } else if (name.endsWith('.js')) {
      fixJs(p);
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error('Missing export dir:', OUT);
  process.exit(1);
}

walk(OUT);
console.log(`Asset URLs fixed for ${isGitHubPages ? 'GitHub Pages deployment' : 'local testing'}.`);
