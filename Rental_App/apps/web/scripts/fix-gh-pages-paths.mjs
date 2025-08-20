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

  // 1) Collapse /Rental_App/Rental_App -> /Rental_App
  txt = txt.replaceAll('/Rental_App/Rental_App/', '/Rental_App/');

  // 2) If anything referenced "/Rental_App/_next" inside already-prefixed pages that
  // will be prefixed again at runtime, normalize to "/_next" (Next will add basePath).
  // This prevents the runtime from turning it into /Rental_App/Rental_App/_next.
  txt = txt.replaceAll('href="/Rental_App/_next/', 'href="/_next/');
  txt = txt.replaceAll('src="/Rental_App/_next/', 'src="/_next/');
  txt = txt.replaceAll('url("/Rental_App/_next/', 'url("/_next/');

  // 3) Also normalize any preloads of _next assets
  txt = txt.replaceAll('"/Rental_App/_next/', '"/_next/');

  if (txt !== before) {
    fs.writeFileSync(file, txt);
    changed++;
  }
});

console.log(`✅ GH Pages path fix complete. Files changed: ${changed}`);
