const fs = require('fs');
const path = require('path');

const apiSecret = 'gemini_secret_998';

const slideshowImages = [
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
  'assets/chair_doge_modulair_cozy.png'
];

async function uploadHomepageAssets() {
  console.log('Uploading slideshow images to theme/assets folder...');
  for (const img of slideshowImages) {
    const fullPath = path.join(__dirname, '..', img);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${img}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const contentBase64 = fileBuffer.toString('base64');
    const filename = path.basename(img);

    console.log(`Uploading ${img}...`);
    try {
      const uploadRes = await fetch(`https://sweetstory.s6-tastewp.com/wp-json/custom/v1/upload-theme-file?secret=${apiSecret}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: filename,
          subfolder: 'assets',
          content_base64: contentBase64
        })
      });
      const resJson = await uploadRes.json();
      if (uploadRes.status === 200 && resJson.success) {
        console.log(` -> SUCCESS! Bytes: ${resJson.bytes}`);
      } else {
        console.error(` -> FAILED! Status: ${uploadRes.status}`, resJson);
      }
    } catch (e) {
      console.error(` -> ERROR:`, e);
    }
  }
  console.log('Slideshow asset upload complete!');
}

uploadHomepageAssets();
