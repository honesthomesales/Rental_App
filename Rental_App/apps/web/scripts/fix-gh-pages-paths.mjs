// fix double /Rental_App and wrong _next URLs in exported output
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'out');

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, cb);
    else if (/\.(html|js|css)$/i.test(name)) cb(p);
  }
}

let changed = 0;

function replaceAllVariants(txt, from, to) {
  // handle with ", ', or no quotes inside CSS url()
  const variants = [
    from,
    from.replace(/"/g, "'"),
    from.replace(/"/g, ''),      // no quotes
  ];
  for (const v of variants) txt = txt.split(v).join(to);
  return txt;
}

walk(OUT, (file) => {
  let txt = fs.readFileSync(file, 'utf8');
  const before = txt;

  // 1) Collapse double base path
  txt = txt.split('/Rental_App/Rental_App/').join('/Rental_App/');

  // 2) Normalize _next asset links: ensure they are "/_next/..." in emitted files
  //    so only ONE basePath gets applied at runtime.
  txt = replaceAllVariants(txt, '"/Rental_App/_next/', '"/_next/');
  txt = replaceAllVariants(txt, "href=\"/Rental_App/_next/", "href=\"/_next/");
  txt = replaceAllVariants(txt, "src=\"/Rental_App/_next/", "src=\"/_next/");
  // CSS url()
  txt = replaceAllVariants(txt, 'url("/Rental_App/_next/', 'url("/_next/');
  txt = replaceAllVariants(txt, "url('/Rental_App/_next/", "url('/_next/");
  txt = replaceAllVariants(txt, 'url(/Rental_App/_next/', 'url(/_next/');

  if (txt !== before) {
    fs.writeFileSync(file, txt);
    changed++;
  }
});

console.log(`✅ GH Pages path fix complete. Files changed: ${changed}`);
