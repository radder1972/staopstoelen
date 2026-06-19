const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

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
        const { data, error } = await supabase.from('brands').select('*').order('name', { ascending: true });
        if (error) throw error;
        res.status(200).json({ brands: data });
      } catch (err) {
        console.error('Supabase fetch brands error:', err);
        res.status(500).json({ error: 'Failed to fetch brands from Supabase: ' + err.message });
      }
      return;
    }

    // Local fallback
    if (!fs.existsSync(DB_FILE)) {
      res.status(200).json({ brands: DEFAULT_BRANDS });
      return;
    }

    try {
      const dbContent = fs.readFileSync(DB_FILE, 'utf8');
      const dbData = JSON.parse(dbContent);
      if (!dbData.brands) {
        dbData.brands = DEFAULT_BRANDS;
      }
      res.status(200).json({ brands: dbData.brands });
    } catch (e) {
      res.status(500).json({ error: 'Failed to read brands database' });
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

    if (!payload || !payload.brands) {
      res.status(400).json({ error: 'Invalid payload structure. Requires brands.' });
      return;
    }

    if (supabase) {
      try {
        // 1. Fetch current IDs
        const { data: existingBrands, error: fetchError } = await supabase.from('brands').select('id');
        if (fetchError) throw fetchError;

        // 2. Upsert
        const brandsToUpsert = payload.brands.map(b => {
          const item = { ...b };
          if (!item.created_at) {
            item.created_at = new Date().toISOString();
          }
          return item;
        });

        const { error: upsertError } = await supabase.from('brands').upsert(brandsToUpsert);
        if (upsertError) throw upsertError;

        // 3. Delete orphans
        const payloadIds = new Set(payload.brands.map(b => b.id));
        const idsToDelete = existingBrands.map(b => b.id).filter(id => !payloadIds.has(id));

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase.from('brands').delete().in('id', idsToDelete);
          if (deleteError) throw deleteError;
        }

        res.status(200).json({ message: 'Brands updated successfully in Supabase' });
      } catch (dbErr) {
        console.error('Supabase save brands error:', dbErr);
        res.status(500).json({ error: 'Failed to save brands to Supabase: ' + dbErr.message });
      }
      return;
    }

    // Local fallback
    try {
      let dbData = { staopstoelen: [], brands: payload.brands };
      if (fs.existsSync(DB_FILE)) {
        const dbContent = fs.readFileSync(DB_FILE, 'utf8');
        dbData = JSON.parse(dbContent);
        dbData.brands = payload.brands;
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
      res.status(200).json({ message: 'Brands updated successfully locally' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to write to local database (read-only filesystem)' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
