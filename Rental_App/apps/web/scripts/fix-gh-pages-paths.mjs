// fix double /Rental_App and wrong _next URLs in exported output
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'out');

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, cb);
    else if (name.endsWith('.html') || name.endsWith('.js') || name.endsWith('.css')) cb(p);
  }
}

let changed = 0;

walk(OUT, (file) => {
  let txt = fs.readFileSync(file, 'utf8');
  const before = txt;

  // 1) Collapse /Rental_App/Rental_App -> /Rental_App (any number of repetitions)
  txt = txt.replaceAll('/Rental_App/Rental_App/', '/Rental_App/');
  txt = txt.replaceAll('/Rental_App/Rental_App', '/Rental_App');
  
  // 2) Handle cases where Next.js already generated URLs with basePath
  // These will get prefixed again by GitHub Pages, so normalize them
  txt = txt.replaceAll('href="/Rental_App/_next/', 'href="/_next/');
  txt = txt.replaceAll('src="/Rental_App/_next/', 'src="/_next/');
  txt = txt.replaceAll('url("/Rental_App/_next/', 'url("/_next/');
  txt = txt.replaceAll('"/Rental_App/_next/', '"/_next/');
  
  // 3) Handle any other basePath references that might get double-prefixed
  txt = txt.replaceAll('href="/Rental_App/', 'href="/');
  txt = txt.replaceAll('src="/Rental_App/', 'src="/');
  txt = txt.replaceAll('url("/Rental_App/', 'url("/');
  txt = txt.replaceAll('"/Rental_App/', '"/');
  
  // 4) Handle CSS imports and other references
  txt = txt.replaceAll('@import "/Rental_App/', '@import "/');
  txt = txt.replaceAll('@import url("/Rental_App/', '@import url("/');

  if (txt !== before) {
    fs.writeFileSync(file, txt);
    changed++;
  }
});

console.log(`✅ GH Pages path fix complete. Files changed: ${changed}`);
