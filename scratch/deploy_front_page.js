const fs = require('fs');
const path = require('path');

const apiSecret = 'gemini_secret_998';

async function deployFrontPage() {
  const localPath = path.join(__dirname, '..', 'template-home.php');
  if (!fs.existsSync(localPath)) {
    console.error('Local template-home.php not found!');
    return;
  }

  const fileBuffer = fs.readFileSync(localPath);
  const contentBase64 = fileBuffer.toString('base64');

  console.log('Uploading front-page.php to active theme folder...');
  try {
    const uploadRes = await fetch(`https://sweetstory.s6-tastewp.com/wp-json/custom/v1/upload-theme-file?secret=${apiSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: 'front-page.php',
        subfolder: '',
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
    console.error(' -> ERROR:', e);
  }
}

deployFrontPage();
