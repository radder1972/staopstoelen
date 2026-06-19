const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Error initializing Supabase client:', e);
  }
}

const imageProvider = process.env.IMAGE_STORAGE_PROVIDER || (supabase ? 'supabase' : 'local');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }
  }

  if (!payload || !payload.filename || !payload.fileData) {
    res.status(400).json({ error: 'Missing filename or fileData in payload' });
    return;
  }

  // Validate base64 format
  const matches = payload.fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    res.status(400).json({ error: 'Invalid fileData format. Must be a base64 Data URL.' });
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
      
      console.log(`Uploaded and saved image to Supabase Storage: ${sanitizedFilename}`);
      
      res.status(200).json({ 
        message: 'Image uploaded successfully to Supabase Storage',
        url: urlData.publicUrl
      });
    } catch (storageErr) {
      console.error('Supabase Storage error:', storageErr);
      res.status(500).json({ error: 'Failed to upload to Supabase Storage: ' + storageErr.message });
    }
    return;
  }

  // Local fallback (saving to /assets)
  try {
    const assetsDir = path.join(process.cwd(), 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const savePath = path.join(assetsDir, sanitizedFilename);
    fs.writeFileSync(savePath, buffer);

    console.log(`Uploaded and saved image locally: ${sanitizedFilename}`);
    
    res.status(200).json({ 
      message: 'Image uploaded successfully locally',
      url: `assets/${sanitizedFilename}`
    });
  } catch (e) {
    console.error('Local upload error:', e);
    res.status(500).json({ error: 'Failed to save upload locally (read-only filesystem): ' + e.message });
  }
};
