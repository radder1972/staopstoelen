require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables in .env!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    console.log("=== SYNCING LOCAL DATABASE TO SUPABASE ===");
    
    // Read local database.json
    const dbPath = path.join(__dirname, '..', 'database.json');
    if (!fs.existsSync(dbPath)) {
        console.error(`Local database.json not found at ${dbPath}`);
        process.exit(1);
    }
    
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const chairs = dbData.staopstoelen || [];
    console.log(`Loaded ${chairs.length} chairs from database.json.`);
    
    try {
        // 1. Inspect table schema by fetching a single row
        console.log("Checking Supabase chairs table schema...");
        const { data: sampleData, error: schemaError } = await supabase.from('chairs').select('*').limit(1);
        if (schemaError) throw schemaError;
        
        const availableColumns = new Set(sampleData.length > 0 ? Object.keys(sampleData[0]) : [
            'id', 'name', 'brand', 'model', 'price', 'image', 'ambientImage', 'condition', 'type', 'material', 'description', 'badge', 'badgeType', 'status', 'imageUp', 'imageLie'
        ]);
        
        const hasFeatures = availableColumns.has('features');
        const hasSpecifications = availableColumns.has('specifications');
        
        console.log("Schema check results:");
        console.log(`- Column 'features' exists: ${hasFeatures}`);
        console.log(`- Column 'specifications' exists: ${hasSpecifications}`);
        
        // 2. Prepare payload
        const chairsToUpsert = chairs.map(c => {
            const item = { ...c };
            
            // Strip fields if they are not in the database schema yet
            if (!hasFeatures) delete item.features;
            if (!hasSpecifications) delete item.specifications;
            
            // Set timestamps
            if (!item.created_at) {
                item.created_at = new Date().toISOString();
            }
            return item;
        });
        
        // 3. Get existing IDs in Supabase to clean up orphans
        const { data: existingChairs, error: fetchError } = await supabase.from('chairs').select('id');
        if (fetchError) throw fetchError;
        
        // 4. Perform upsert
        console.log(`Upserting ${chairsToUpsert.length} chairs to Supabase...`);
        const { error: upsertError } = await supabase.from('chairs').upsert(chairsToUpsert);
        if (upsertError) throw upsertError;
        
        // 5. Delete orphans
        const payloadIds = new Set(chairs.map(c => c.id));
        const idsToDelete = existingChairs.map(c => c.id).filter(id => !payloadIds.has(id));
        
        if (idsToDelete.length > 0) {
            console.log(`Deleting ${idsToDelete.length} orphan chairs from Supabase...`);
            const { error: deleteError } = await supabase.from('chairs').delete().in('id', idsToDelete);
            if (deleteError) throw deleteError;
        }
        
        console.log("SUCCESS: Database synced successfully!");
        
        if (!hasFeatures || !hasSpecifications) {
            console.log("\n[ACTION REQUIRED] Features and specifications columns are currently missing in Supabase.");
            console.log("To fully display features and specs on the live site, please execute the following SQL in your Supabase SQL Editor:");
            console.log("--------------------------------------------------");
            console.log("ALTER TABLE chairs ADD COLUMN IF NOT EXISTS features jsonb;");
            console.log("ALTER TABLE chairs ADD COLUMN IF NOT EXISTS specifications jsonb;");
            console.log("--------------------------------------------------");
            console.log("Once done, run this sync script again to upload the missing details!");
        }
        
    } catch (err) {
        console.error("Sync failed:", err.message || err);
    }
}

sync();
