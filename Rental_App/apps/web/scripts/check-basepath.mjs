import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(process.cwd(), 'out', 'index.html'), 'utf8');
if (html.includes('/Rental_App/Rental_App/')) {
  console.error('❌ Found double prefix in out/index.html');
  process.exit(1);
} else {
  console.log('✅ No double prefix found in out/index.html');
}
