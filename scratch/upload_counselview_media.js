const fs = require('fs');
const path = require('path');

const siteUrl = 'https://counselview.s6-tastewp.com';
const loginUrl = `${siteUrl}/wp-login.php`;
const adminUrl = `${siteUrl}/wp-admin`;
const mediaApiUrl = `${siteUrl}/wp-json/wp/v2/media`;

const username = 'admin';
const password = 'xYf3vt6Xvqw';

const imagesToUpload = [
  // Cozy slideshow images
  'assets/chair_dordrecht_cozy.png',
  'assets/chair_zwijndrecht_cozy.png',
  'assets/chair_rotterdam_cozy.png',
  'assets/chair_fitform_570_reco_cozy.png',
  'assets/sta_opstoel_geerts_interior.png',
  'assets/chair_movie_cozy.png',
  'assets/chair_alfred_cozy.png',
  'assets/chair_athena_cozy.png',
  'assets/chair_fiji_cozy.png',
  'assets/chair_industro_cozy.png',
  'assets/chair_bellino_cozy.png',
  'assets/chair_doge_modulair_cozy.png',
  // Page graphics
  'assets/geert.png',
  'assets/geert_secret.jpg',
  'assets/bezorging.png',
  'assets/pand.jpg',
  'assets/revisie_voor.png',
  'assets/revisie_na.png',
  'assets/revisie_stap1.jpg',
  'assets/revisie_stap2.jpg',
  'assets/revisie_stap3.jpg',
  'assets/revisie_stap4.jpg',
  'assets/review_bakker.png',
  'assets/review_devries.png',
  'assets/review_hensen.png',
  'assets/review_vandam.png'
];

async function main() {
  console.log('1. Logging in to counselview...');
  const params = new URLSearchParams();
  params.append('log', username);
  params.append('pwd', password);
  params.append('wp-submit', 'Log In');
  params.append('testcookie', '1');

  let cookieHeader = '';
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
    cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('Successfully logged in!');
  } catch (err) {
    console.error('Login failed:', err);
    return;
  }

  console.log('\n2. Retrieving REST API Nonce from admin panel...');
  let restNonce = '';
  try {
    const adminRes = await fetch(adminUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const adminHtml = await adminRes.text();
    const nonceMatch = adminHtml.match(/"nonce":"([^"]+)"/);
    if (nonceMatch) {
      restNonce = nonceMatch[1];
      console.log(`Found REST Nonce: ${restNonce}`);
    } else {
      console.error('REST Nonce not found in admin panel!');
      return;
    }
  } catch (e) {
    console.error('Error fetching REST nonce:', e);
    return;
  }

  console.log('\n3. Uploading static images to Media Library...');
  for (const img of imagesToUpload) {
    const fullPath = path.join(__dirname, '..', img);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${img}`);
      continue;
    }

    const filename = path.basename(img);
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(img).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    console.log(`Uploading ${filename}...`);
    try {
      const response = await fetch(mediaApiUrl, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'X-WP-Nonce': restNonce,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': contentType,
          'User-Agent': 'Mozilla/5.0'
        },
        body: fileBuffer
      });

      const resJson = await response.json();
      if (response.status === 201 && resJson.id) {
        console.log(` -> SUCCESS! Uploaded ID: ${resJson.id}, URL: ${resJson.source_url}`);
      } else {
        console.error(` -> FAILED! Status: ${response.status}`, resJson);
      }
    } catch (e) {
      console.error(` -> Error uploading ${filename}:`, e);
    }
  }

  console.log('\nAll static images uploaded successfully!');
}

main();
