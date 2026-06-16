require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const BEHEER_FILE = path.join(__dirname, 'beheer.html');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const imageProvider = process.env.IMAGE_STORAGE_PROVIDER || 'local';

const DEFAULT_BRANDS = [
  { id: 'fitform', name: 'Fitform' },
  { id: 'doge', name: 'Doge' },
  { id: 'mecam', name: 'Mecam' },
  { id: 'hjort-knudsen', name: 'Hjort Knudsen' },
  { id: 'dfm', name: 'DFM' },
  { id: 'de-toekomst', name: 'De Toekomst' },
  { id: 'farstrup', name: 'Farstrup' },
  { id: 'huismerk', name: 'Huismerk' },
  { id: 'overig', name: 'Overig' }
];

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully.');
  } catch (e) {
    console.error('Error initializing Supabase client:', e);
  }
} else {
  console.log('WARNING: Supabase URL and Key not found in .env. Falling back to local database.json and local assets/ storage.');
}

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

// Only init local database if we aren't using Supabase
if (!supabase) {
  initDatabase();
}

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
  
  // GET /api/chairs - returns the database JSON (from Supabase or local file)
  if (req.url === '/api/chairs' && req.method === 'GET') {
    if (supabase) {
      supabase
        .from('chairs')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            console.error('Supabase fetch error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch chairs from Supabase: ' + error.message }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ staopstoelen: data }));
        })
        .catch(err => {
          console.error('Supabase fetch promise rejected:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch chairs from Supabase: ' + err.message }));
        });
      return;
    }
    
    // Local fallback
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
  
  // GET /api/brands - returns the list of brands (from Supabase or local file)
  if (req.url === '/api/brands' && req.method === 'GET') {
    if (supabase) {
      supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) {
            console.error('Supabase fetch brands error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch brands from Supabase: ' + error.message }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ brands: data }));
        })
        .catch(err => {
          console.error('Supabase fetch brands promise rejected:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch brands from Supabase: ' + err.message }));
        });
      return;
    }
    
    // Local fallback
    if (!fs.existsSync(DB_FILE)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ brands: DEFAULT_BRANDS }));
      return;
    }
    
    try {
      const dbContent = fs.readFileSync(DB_FILE, 'utf8');
      const dbData = JSON.parse(dbContent);
      if (!dbData.brands) {
        dbData.brands = DEFAULT_BRANDS;
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ brands: dbData.brands }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read brands database' }));
    }
    return;
  }
  
  // POST /api/brands - updates the brands (in Supabase or local file)
  if (req.url === '/api/brands' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        
        // Basic validation: must have the brands array
        if (!payload.brands) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload structure. Requires brands.' }));
          return;
        }
        
        if (supabase) {
          try {
            // 1. Fetch current IDs in DB
            const { data: existingBrands, error: fetchError } = await supabase
              .from('brands')
              .select('id');
            
            if (fetchError) throw fetchError;
            
            // 2. Upsert current payload (ensuring created_at is not null to prevent Postgrest bulk upsert null default violations)
            const brandsToUpsert = payload.brands.map(b => {
              const item = { ...b };
              if (!item.created_at) {
                item.created_at = new Date().toISOString();
              }
              return item;
            });

            const { error: upsertError } = await supabase
              .from('brands')
              .upsert(brandsToUpsert);
            
            if (upsertError) throw upsertError;
            
            // 3. Find deleted brands (orphans) and delete them from DB
            const payloadIds = new Set(payload.brands.map(b => b.id));
            const idsToDelete = existingBrands
              .map(b => b.id)
              .filter(id => !payloadIds.has(id));
            
            if (idsToDelete.length > 0) {
              const { error: deleteError } = await supabase
                .from('brands')
                .delete()
                .in('id', idsToDelete);
              
              if (deleteError) throw deleteError;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Brands updated successfully in Supabase' }));
          } catch (dbErr) {
            console.error('Supabase save brands error:', dbErr);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to save brands to Supabase: ' + dbErr.message }));
          }
          return;
        }
        
        // Local fallback
        if (fs.existsSync(DB_FILE)) {
          const dbContent = fs.readFileSync(DB_FILE, 'utf8');
          const dbData = JSON.parse(dbContent);
          dbData.brands = payload.brands;
          fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
        } else {
          fs.writeFileSync(DB_FILE, JSON.stringify({ staopstoelen: [], brands: payload.brands }, null, 2), 'utf8');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Brands updated successfully locally' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // POST /api/chairs - updates the database JSON (in Supabase or local file)
  if (req.url === '/api/chairs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        
        // Basic validation: must have the staopstoelen array
        if (!payload.staopstoelen) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload structure. Requires staopstoelen.' }));
          return;
        }
        
        if (supabase) {
          try {
            // 1. Fetch current IDs in DB
            const { data: existingChairs, error: fetchError } = await supabase
              .from('chairs')
              .select('id');
            
            if (fetchError) throw fetchError;
            
            // 2. Upsert current payload (ensuring created_at is not null to prevent Postgrest bulk upsert null default violations)
            const chairsToUpsert = payload.staopstoelen.map(c => {
              const item = { ...c };
              if (!item.created_at) {
                item.created_at = new Date().toISOString();
              }
              return item;
            });

            const { error: upsertError } = await supabase
              .from('chairs')
              .upsert(chairsToUpsert);
            
            if (upsertError) throw upsertError;
            
            // 3. Find deleted chairs (orphans) and delete them from DB
            const payloadIds = new Set(payload.staopstoelen.map(c => c.id));
            const idsToDelete = existingChairs
              .map(c => c.id)
              .filter(id => !payloadIds.has(id));
            
            if (idsToDelete.length > 0) {
              const { error: deleteError } = await supabase
                .from('chairs')
                .delete()
                .in('id', idsToDelete);
              
              if (deleteError) throw deleteError;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Database updated successfully in Supabase' }));
          } catch (dbErr) {
            console.error('Supabase save error:', dbErr);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to save to Supabase: ' + dbErr.message }));
          }
          return;
        }
        
        // Local fallback
        fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Database updated successfully locally' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }
  
  // POST /api/upload - handles base64 image uploading and saves to Supabase Storage or local assets/
  if (req.url === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
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

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const sanitizedFilename = path.basename(payload.filename).replace(/[^a-zA-Z0-9.\-_]/g, '_');

        if (supabase && imageProvider === 'supabase') {
          try {
            // Upload to Supabase Storage bucket 'assets'
            const { data, error: uploadError } = await supabase.storage
              .from('assets')
              .upload(sanitizedFilename, buffer, {
                contentType: mimeType,
                upsert: true
              });
              
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('assets')
              .getPublicUrl(sanitizedFilename);
              
            if (!urlData || !urlData.publicUrl) {
              throw new Error("Failed to get public URL from Supabase Storage");
            }
            
            console.log(`Uploaded and saved image to Supabase Storage bucket "assets": ${sanitizedFilename}`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              message: 'Image uploaded successfully to Supabase Storage',
              url: urlData.publicUrl
            }));
          } catch (storageErr) {
            console.error('Supabase Storage error:', storageErr);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to upload to Supabase Storage: ' + storageErr.message }));
          }
          return;
        }

        // Local fallback (saving to /assets)
        const assetsDir = path.join(__dirname, 'assets');
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }

        const savePath = path.join(assetsDir, sanitizedFilename);
        fs.writeFileSync(savePath, buffer);

        console.log(`Uploaded and saved image locally: ${sanitizedFilename}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Image uploaded successfully locally',
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
