const fs = require('fs');
const path = require('path');

const siteUrl = 'https://counselview.s6-tastewp.com';
const loginUrl = `${siteUrl}/wp-login.php`;
const snippetsPageUrl = `${siteUrl}/wp-admin/admin.php?page=add-snippet`;
const mediaUrl = `${siteUrl}/wp-json/wp/v2/media`;
const importUrl = `${siteUrl}/wp-json/custom/v1/import-chair`;
const productsApiUrl = `${siteUrl}/wp-json/wp/v2/product`;

const username = 'admin';
const password = 'xYf3vt6Xvqw';

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function runImport() {
  console.log('Logging in to counselview...');
  const params = new URLSearchParams();
  params.append('log', username);
  params.append('pwd', password);
  params.append('wp-submit', 'Log In');
  params.append('testcookie', '1');

  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: params.toString(),
      redirect: 'manual'
    });

    const cookies = loginRes.headers.getSetCookie();
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    // Get REST nonce
    console.log('Getting REST API Nonce...');
    const pageRes = await fetch(snippetsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const pageHtml = await pageRes.text();
    const settingsMatch = pageHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    if (!settingsMatch) {
      console.error('Could not find REST nonce!');
      return;
    }
    const nonce = JSON.parse(settingsMatch[1]).restAPI.nonce;
    console.log('REST nonce:', nonce);

    // 1. Clear existing products first
    console.log('Fetching existing products for cleanup...');
    const fetchProductsRes = await fetch(`${productsApiUrl}?per_page=100&status=any`, {
      headers: {
        'Cookie': cookieHeader,
        'X-WP-Nonce': nonce,
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (fetchProductsRes.ok) {
      const existingProducts = await fetchProductsRes.json();
      console.log(`Found ${existingProducts.length} existing products to delete.`);
      for (const prod of existingProducts) {
        console.log(`Deleting product: ${prod.title.rendered} (ID: ${prod.id})...`);
        const delRes = await fetch(`${productsApiUrl}/${prod.id}?force=true`, {
          method: 'DELETE',
          headers: {
            'Cookie': cookieHeader,
            'X-WP-Nonce': nonce,
            'User-Agent': 'Mozilla/5.0'
          }
        });
        if (delRes.ok) {
          console.log(`Deleted product ID: ${prod.id}`);
        } else {
          console.error(`Failed to delete product ID: ${prod.id}`, delRes.status);
        }
      }
    } else {
      console.log('Could not fetch existing products (WooCommerce might not have exposed wp/v2/product or it is empty).');
    }

    // 2. Read local database.json
    const dbPath = path.join(__dirname, '..', 'database.json');
    if (!fs.existsSync(dbPath)) {
      console.error('database.json not found at:', dbPath);
      return;
    }

    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const chairsToImport = db.staopstoelen; // Import ALL chairs
    console.log(`Found ${chairsToImport.length} chairs to import from database.json.`);

    // Cache to prevent uploading duplicate images
    const imageCache = {};

    async function uploadImage(localRelativePath) {
      if (!localRelativePath) return null;
      if (imageCache[localRelativePath]) {
        console.log(`Using cached media ID for: ${localRelativePath}`);
        return imageCache[localRelativePath];
      }

      const fullPath = path.join(__dirname, '..', localRelativePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Local file does not exist: ${fullPath}`);
        return null;
      }

      console.log(`Uploading image: ${localRelativePath} (${fs.statSync(fullPath).size} bytes)...`);
      const fileBuffer = fs.readFileSync(fullPath);
      const fileName = path.basename(localRelativePath);
      const mime = getMimeType(localRelativePath);

      const mediaRes = await fetch(mediaUrl, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'X-WP-Nonce': nonce,
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'User-Agent': 'Mozilla/5.0'
        },
        body: fileBuffer
      });

      if (!mediaRes.ok) {
        console.error(`Failed to upload image ${localRelativePath}:`, mediaRes.status, await mediaRes.text());
        return null;
      }

      const mediaJson = await mediaRes.json();
      console.log(`Image uploaded successfully! Media ID: ${mediaJson.id}`);
      imageCache[localRelativePath] = mediaJson.id;
      return mediaJson.id;
    }

    for (const chair of chairsToImport) {
      console.log(`\nProcessing chair: ${chair.name}...`);

      // Upload main image
      const imageId = await uploadImage(chair.image);

      // Upload extra images (including ambient image)
      const imageUpId = await uploadImage(chair.imageUp);
      const imageLieId = await uploadImage(chair.imageLie);
      const ambientImageId = await uploadImage(chair.ambientImage);

      // Import product
      const productPayload = {
        name: chair.name,
        price: chair.price,
        description: chair.description || '',
        brand: chair.brand || 'Overig',
        model: chair.model || '',
        condition: chair.condition || 'nieuw',
        type: chair.type || 'staop',
        material: chair.material || 'stof',
        status: chair.status || 'beschikbaar',
        badge: chair.badge || '',
        badgeType: chair.badgeType || 'new',
        image_id: imageId,
        image_up_id: imageUpId,
        image_lie_id: imageLieId,
        ambient_image_id: ambientImageId
      };

      console.log('Sending import payload...');
      const importRes = await fetch(importUrl, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'X-WP-Nonce': nonce,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify(productPayload)
      });

      if (importRes.ok) {
        const importJson = await importRes.json();
        console.log(`SUCCESS: Imported ${chair.name} with WordPress product ID ${importJson.id}`);
      } else {
        console.error(`FAILED: Could not import ${chair.name}:`, importRes.status, await importRes.text());
      }
    }

    console.log('\nImport process completed!');

  } catch (err) {
    console.error('Error running import:', err);
  }
}

runImport();
