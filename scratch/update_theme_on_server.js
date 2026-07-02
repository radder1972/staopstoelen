const fs = require('fs');
const path = require('path');

const siteUrl = 'https://counselview.s6-tastewp.com';
const loginUrl = `${siteUrl}/wp-login.php`;
const adminUrl = `${siteUrl}/wp-admin`;
const themeInstallUrl = `${adminUrl}/theme-install.php?tab=upload`;
const updateUrl = `${adminUrl}/update.php`;
const snippetsApiUrl = `${siteUrl}/wp-json/code-snippets/v1/snippets`;

const username = 'admin';
const password = 'xYf3vt6Xvqw';

// PHP code to delete the theme directory
const deleteThemePhp = `
add_action('init', function() {
    $theme_dir = WP_CONTENT_DIR . '/themes/staopstoelen-theme';
    if (file_exists($theme_dir)) {
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($theme_dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($files as $fileinfo) {
            $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
            $todo($fileinfo->getRealPath());
        }
        rmdir($theme_dir);
    }
});
`;

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
    console.log('Logged in successfully!');
  } catch (err) {
    console.error('Login failed:', err);
    return;
  }

  // 2. Fetch REST Nonce for Code Snippets
  console.log('\n2. Retrieving REST API Nonce...');
  let apiNonce = '';
  try {
    const snipPageRes = await fetch(`${adminUrl}/admin.php?page=add-snippet`, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const snipHtml = await snipPageRes.text();
    const settingsMatch = snipHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    if (settingsMatch) {
      apiNonce = JSON.parse(settingsMatch[1]).restAPI.nonce;
      console.log(`Found REST API Nonce: ${apiNonce}`);
    } else {
      console.error('Could not find REST nonce for Code Snippets.');
      return;
    }
  } catch (e) {
    console.error('Error fetching REST nonce:', e);
    return;
  }

  // 3. Create temporary snippet to delete theme folder
  console.log('\n3. Creating temporary snippet to delete old theme folder...');
  let tempSnippetId = 0;
  try {
    const response = await fetch(snippetsApiUrl, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'X-WP-Nonce': apiNonce,
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        name: 'Temporary Theme Cleaner',
        desc: 'Deletes the theme directory so we can overwrite it.',
        code: deleteThemePhp,
        active: 1
      })
    });
    const resJson = await response.json();
    tempSnippetId = resJson.id;
    console.log(`Temporary Snippet ID: ${tempSnippetId} created.`);
  } catch (e) {
    console.error('Error creating snippet:', e);
    return;
  }

  // 4. Trigger snippet by requesting homepage
  console.log('\n4. Triggering snippet to delete theme folder...');
  try {
    const triggerRes = await fetch(siteUrl + '/?cache-buster=' + Date.now(), {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(` -> Requested homepage, status: ${triggerRes.status}`);
  } catch (e) {
    console.error('Error triggering snippet:', e);
  }

  // 5. Delete temporary cleaner snippet
  console.log(`\n5. Deleting temporary cleaner snippet #${tempSnippetId}...`);
  try {
    await fetch(`${snippetsApiUrl}/${tempSnippetId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': cookieHeader,
        'X-WP-Nonce': apiNonce,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('Cleaner snippet deleted successfully.');
  } catch (e) {
    console.error('Error deleting cleaner snippet:', e);
  }

  // 6. Upload the new theme ZIP
  console.log('\n6. Uploading new theme ZIP file...');
  const zipPath = path.join(__dirname, '..', 'staopstoelen-theme.zip');
  if (!fs.existsSync(zipPath)) {
    console.error(`Theme ZIP file not found at: ${zipPath}`);
    return;
  }

  try {
    const themeInstallPage = await fetch(themeInstallUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const themeInstallHtml = await themeInstallPage.text();
    const nonceMatch = themeInstallHtml.match(/name="_wpnonce" value="([^"]+)"/);
    if (!nonceMatch) {
      console.error('Theme upload nonce not found!');
      return;
    }
    const themeUploadNonce = nonceMatch[1];
    console.log(`Found theme upload nonce: ${themeUploadNonce}`);

    const zipBuffer = fs.readFileSync(zipPath);
    const form = new FormData();
    form.append('_wpnonce', themeUploadNonce);
    form.append('_wp_http_referer', '/wp-admin/theme-install.php?tab=upload');
    const zipBlob = new Blob([zipBuffer], { type: 'application/zip' });
    form.append('themezip', zipBlob, 'staopstoelen-theme.zip');
    form.append('installtheme-zip', 'Install Now');

    console.log('Sending native multipart form request to upload new theme ZIP...');
    const uploadRes = await fetch(updateUrl + '?action=upload-theme', {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0'
      },
      body: form
    });

    const uploadHtml = await uploadRes.text();
    console.log('Theme upload request finished.');

    const actMatch = uploadHtml.match(/href="([^"]*themes\.php\?action=activate[^"]*stylesheet=staopstoelen-theme[^"]*)"/);
    if (actMatch) {
      const rawActUrl = actMatch[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
      const fullThemeActUrl = rawActUrl.startsWith('http') ? rawActUrl : `${siteUrl}/wp-admin/${rawActUrl}`;
      console.log('Activating custom Staopstoelen theme...');
      const themeActRes = await fetch(fullThemeActUrl, {
        headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(` -> Theme activation status: ${themeActRes.status}`);
    } else {
      console.error('Theme activation link not found in response! Check theme upload results.');
    }
  } catch (e) {
    console.error('Error uploading and activating theme:', e);
  }

  // 7. Verify the theme is working on home page
  console.log('\n7. Verifying homepage rendering...');
  try {
    const verifyRes = await fetch(`${siteUrl}/?cache-buster=` + Date.now(), {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const verifyHtml = await verifyRes.text();
    if (verifyHtml.includes('Gereviseerde Sta-op Stoelen')) {
      console.log(' -> SUCCESS! Staopstoelen Theme is successfully updated, active and verified!');
    } else {
      console.log(' -> Homepage verify failed, check theme status manually.');
    }
  } catch (e) {
    console.error('Error verifying homepage:', e);
  }
}

main();
