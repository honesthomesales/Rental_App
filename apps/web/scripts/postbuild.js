const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');
const tempDir = path.join(__dirname, '..', 'api-temp');

try {
  if (fs.existsSync(tempDir)) {
    fs.renameSync(tempDir, apiDir);
    console.log('Restored API routes from temp directory');
  } else {
    console.log('API temp directory not found');
  }
} catch (error) {
  console.error('Error restoring API directory:', error.message);
  process.exit(1);
}
