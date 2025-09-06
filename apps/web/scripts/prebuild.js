const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');
const tempDir = path.join(__dirname, '..', 'api-temp');

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, tempDir);
    console.log('Moved API routes to temp directory');
  } else {
    console.log('API directory not found');
  }
} catch (error) {
  console.error('Error moving API directory:', error.message);
  process.exit(1);
}
