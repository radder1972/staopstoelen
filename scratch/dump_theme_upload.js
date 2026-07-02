const fs = require('fs');
const path = require('path');

const loginUrl = 'https://counselview.s6-tastewp.com/wp-login.php';
const themeInstallUrl = 'https://counselview.s6-tastewp.com/wp-admin/theme-install.php?tab=upload';
const updateUrl = 'https://counselview.s6-tastewp.com/wp-admin/update.php';

const username = 'admin';
const password = 'xYf3vt6Xvqw';

async function upload() {
  console.log('Logging in...');
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

    console.log('Getting upload nonce...');
    const pageRes = await fetch(themeInstallUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const pageHtml = await pageRes.text();
    const nonceMatch = pageHtml.match(/name="_wpnonce" value="([^"]+)"/);
    if (!nonceMatch) {
      console.log('Nonce not found!');
      return;
    }
    const nonce = nonceMatch[1];
    console.log('Upload Nonce:', nonce);

    const zipPath = path.join(__dirname, '..', 'staopstoelen-theme.zip');
    const zipBuffer = fs.readFileSync(zipPath);
    
    // Use native global FormData and Blob (supported in Node 18+)
    const form = new FormData();
    form.append('_wpnonce', nonce);
    form.append('_wp_http_referer', '/wp-admin/theme-install.php?tab=upload');
    
    const zipBlob = new Blob([zipBuffer], { type: 'application/zip' });
    form.append('themezip', zipBlob, 'staopstoelen-theme.zip');
    form.append('installtheme-zip', 'Install Now');

    console.log('Posting theme zip using native FormData...');
    const uploadRes = await fetch(updateUrl + '?action=upload-theme', {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0'
        // Do NOT set Content-Type header, fetch will automatically set the correct boundary!
      },
      body: form
    });
    
    const uploadHtml = await uploadRes.text();
    fs.writeFileSync(path.join(__dirname, 'theme_upload_result.html'), uploadHtml, 'utf8');
    console.log('Saved upload output to theme_upload_result.html');
  } catch (e) {
    console.error(e);
  }
}

upload();
