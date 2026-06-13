const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const BEHEER_FILE = path.join(__dirname, 'beheer.html');

// Helper to extract JS array block by matching balanced brackets
function extractJSArray(content, varName) {
  const pattern = new RegExp(`const\\s+${varName}\\s*=\\s*\\[`);
  const match = content.match(pattern);
  if (!match) return null;
  
  const startIdx = match.index + match[0].length - 1;
  let depth = 0;
  let endIdx = -1;
  
  for (let i = startIdx; i < content.length; i++) {
    const char = content[i];
    if (char === '[') {
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx === -1) return null;
  const arrayString = content.substring(startIdx, endIdx + 1);
  
  // Safely evaluate the JS array using Function
  try {
    return new Function(`return ${arrayString}`)();
  } catch (e) {
    console.error(`Error parsing ${varName}:`, e);
    return null;
  }
}

// Auto-initialize database.json if it doesn't exist
function initDatabase() {
  if (fs.existsSync(DB_FILE)) {
    console.log('Database file database.json already exists.');
    return;
  }
  
  console.log('Initializing database.json from beheer.html...');
  if (!fs.existsSync(BEHEER_FILE)) {
    console.error(`Cannot find beheer.html at ${BEHEER_FILE} to initialize database.`);
    return;
  }
  
  try {
    const htmlContent = fs.readFileSync(BEHEER_FILE, 'utf8');
    
    const staop = extractJSArray(htmlContent, 'DEFAULT_STAOPSTOELEN');
    
    if (!staop) {
      throw new Error('Failed to extract default staopstoelen dataset from beheer.html');
    }
    
    const dbData = {
      staopstoelen: staop
    };
    
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    console.log('Successfully initialized database.json.');
  } catch (e) {
    console.error('Failed to auto-initialize database:', e);
  }
}

initDatabase();

// Create HTTP server
const server = http.createServer((req, res) => {
  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // GET /api/chairs - returns the database JSON
  if (req.url === '/api/chairs' && req.method === 'GET') {
    if (!fs.existsSync(DB_FILE)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database not initialized' }));
      return;
    }
    
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read database' }));
    }
    return;
  }
  
  // POST /api/chairs - updates the database JSON
  if (req.url === '/api/chairs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        // Basic validation: must have the staopstoelen array
        if (!payload.staopstoelen) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload structure. Requires staopstoelen.' }));
          return;
        }
        
        fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Database updated successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }
  
  // POST /api/upload - handles base64 image uploading and saves to assets/
  if (req.url === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        if (!payload.filename || !payload.fileData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing filename or fileData in payload' }));
          return;
        }

        // Validate base64 format
        const matches = payload.fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid fileData format. Must be a base64 Data URL.' }));
          return;
        }

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(payload.filename).replace(/[^a-zA-Z0-9.\-_]/g, '_');
        
        // Ensure assets directory exists
        const assetsDir = path.join(__dirname, 'assets');
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }

        const savePath = path.join(assetsDir, sanitizedFilename);
        fs.writeFileSync(savePath, buffer);

        console.log(`Uploaded and saved image: ${sanitizedFilename}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Image uploaded successfully',
          url: `assets/${sanitizedFilename}`
        }));
      } catch (e) {
        console.error('Upload handler error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error during upload' }));
      }
    });
    return;
  }
  
  // Serve static files for everything else
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') {
    urlPath = '/index.html';
  }
  
  const filePath = path.join(__dirname, urlPath);
  
  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.json': 'application/json; charset=utf-8'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Local Database API Server running at http://localhost:${PORT}`);
});
