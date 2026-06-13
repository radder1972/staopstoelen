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
    const senioren = extractJSArray(htmlContent, 'DEFAULT_SENIORENSTOELEN');
    const occasions = extractJSArray(htmlContent, 'DEFAULT_OCCASIONS');
    
    if (!staop || !senioren || !occasions) {
      throw new Error('Failed to extract default datasets from beheer.html');
    }
    
    const dbData = {
      staopstoelen: staop,
      seniorenstoelen: senioren,
      occasions: occasions
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
        
        // Basic validation: must have the three arrays
        if (!payload.staopstoelen || !payload.seniorenstoelen || !payload.occasions) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload structure. Requires staopstoelen, seniorenstoelen, and occasions.' }));
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
  
  // 404 Route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Local Database API Server running at http://localhost:${PORT}`);
});
