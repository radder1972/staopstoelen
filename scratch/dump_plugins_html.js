const fs = require('fs');
const path = require('path');

const loginUrl = 'https://counselview.s6-tastewp.com/wp-login.php';
const pluginsPageUrl = 'https://counselview.s6-tastewp.com/wp-admin/plugins.php';

const username = 'admin';
const password = 'xYf3vt6Xvqw';

async function dump() {
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

    const pluginsRes = await fetch(pluginsPageUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const pluginsHtml = await pluginsRes.text();
    
    // Write HTML to a file so we can view it
    fs.writeFileSync(path.join(__dirname, 'plugins_page.html'), pluginsHtml, 'utf8');
    console.log('Saved plugins page to plugins_page.html');
  } catch (e) {
    console.error('Error:', e);
  }
}

dump();
