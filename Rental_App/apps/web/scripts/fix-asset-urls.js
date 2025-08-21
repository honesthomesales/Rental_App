const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'out');

function fixHtml(file) {
  let html = fs.readFileSync(file, 'utf8');
  
  // CRITICAL FIXES for GitHub Pages deployment:
  
  // 1) Fix relative _next paths to absolute GitHub Pages paths
  html = html.replace(/href="\/_next\//g, 'href="/Rental_App/_next/');
  html = html.replace(/src="\/_next\//g, 'src="/Rental_App/_next/');
  
  // 2) Fix any remaining relative paths
  html = html.replace(/href="_next\//g, 'href="/Rental_App/_next/');
  html = html.replace(/src="_next\//g, 'src="/Rental_App/_next/');
  
  // 3) Fix CSS url() references
  html = html.replace(/url\(\/_next\//g, 'url(/Rental_App/_next/');
  html = html.replace(/url\('\/_next\//g, "url('/Rental_App/_next/");
  html = html.replace(/url\("\/_next\//g, 'url("/Rental_App/_next/');
  
  // 4) Fix any double prefix issues (safety check)
  html = html.replace(/\/Rental_App\/Rental_App\/_next\//g, '/Rental_App/_next/');
  
  // 5) Fix assetPrefix in JSON data
  html = html.replace(/"assetPrefix":"\/_next"/g, '"assetPrefix":"/Rental_App/_next"');
  html = html.replace(/"assetPrefix":"_next"/g, '"assetPrefix":"/Rental_App/_next"');
  
  // 6) Fix CSS references in script data (critical for styling)
  html = html.replace(/"\/_next\/static\/css\//g, '"/Rental_App/_next/static/css/');
  html = html.replace(/'\/_next\/static\/css\//g, "'/Rental_App/_next/static/css/");
  
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
console.log('✅ HTML asset URLs sanitized for GitHub Pages deployment.');
