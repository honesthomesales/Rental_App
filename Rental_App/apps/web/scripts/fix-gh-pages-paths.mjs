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

  // 1) Fix any remaining double prefixes (shouldn't happen with new config, but just in case)
  txt = txt.replaceAll('/Rental_App/Rental_App/', '/Rental_App/');
  txt = txt.replaceAll('/Rental_App/Rental_App', '/Rental_App');
  
  // 2) Ensure all _next asset references use the correct single prefix
  // Replace any absolute paths that might have been generated incorrectly
  txt = txt.replaceAll('href="/Rental_App/_next/', 'href="/Rental_App/_next/');
  txt = txt.replaceAll('src="/Rental_App/_next/', 'src="/Rental_App/_next/');
  txt = txt.replaceAll('url("/Rental_App/_next/', 'url("/Rental_App/_next/');
  txt = txt.replaceAll('"/Rental_App/_next/', '"/Rental_App/_next/');
  
  // 3) Fix any CSS imports or other asset references
  txt = txt.replaceAll('@import "/Rental_App/', '@import "/Rental_App/');
  txt = txt.replaceAll('@import url("/Rental_App/', '@import url("/Rental_App/');
  
  // 4) Ensure all internal links use relative paths (Next.js will add basePath)
  txt = txt.replaceAll('href="/Rental_App/', 'href="/');
  txt = txt.replaceAll('src="/Rental_App/', 'src="/');
  txt = txt.replaceAll('url("/Rental_App/', 'url("/');
  txt = txt.replaceAll('"/Rental_App/', '"/');

  if (txt !== before) {
    fs.writeFileSync(file, txt);
    changed++;
  }
});

console.log(`✅ GH Pages path fix complete. Files changed: ${changed}`);
