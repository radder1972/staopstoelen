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

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const DB_FILE = path.join(process.cwd(), 'database.json');

  if (req.method === 'GET') {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('chairs').select('*');
        if (error) throw error;
        res.status(200).json({ staopstoelen: data });
      } catch (err) {
        console.error('Supabase fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch chairs from Supabase: ' + err.message });
      }
      return;
    }

    // Local fallback
    if (!fs.existsSync(DB_FILE)) {
      res.status(404).json({ error: 'Database not initialized' });
      return;
    }

    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      res.status(200).send(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to read database' });
    }
    return;
  }

  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON payload' });
        return;
      }
    }

    if (!payload || !payload.staopstoelen) {
      res.status(400).json({ error: 'Invalid payload structure. Requires staopstoelen.' });
      return;
    }

    if (supabase) {
      try {
        // 1. Fetch current IDs
        const { data: existingChairs, error: fetchError } = await supabase.from('chairs').select('id');
        if (fetchError) throw fetchError;

        // 2. Upsert
        const chairsToUpsert = payload.staopstoelen.map(c => {
          const item = { ...c };
          if (!item.created_at) {
            item.created_at = new Date().toISOString();
          }
          return item;
        });

        const { error: upsertError } = await supabase.from('chairs').upsert(chairsToUpsert);
        if (upsertError) throw upsertError;

        // 3. Delete orphans
        const payloadIds = new Set(payload.staopstoelen.map(c => c.id));
        const idsToDelete = existingChairs.map(c => c.id).filter(id => !payloadIds.has(id));

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase.from('chairs').delete().in('id', idsToDelete);
          if (deleteError) throw deleteError;
        }

        res.status(200).json({ message: 'Database updated successfully in Supabase' });
      } catch (dbErr) {
        console.error('Supabase save error:', dbErr);
        res.status(500).json({ error: 'Failed to save to Supabase: ' + dbErr.message });
      }
      return;
    }

    // Local fallback
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
      res.status(200).json({ message: 'Database updated successfully locally' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to write to local database (read-only filesystem)' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
