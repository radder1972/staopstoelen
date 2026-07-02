const fs = require('fs');
const path = require('path');

const loginUrl = 'https://counselview.s6-tastewp.com/wp-login.php';
const pluginsPageUrl = 'https://counselview.s6-tastewp.com/wp-admin/plugins.php';
const themesPageUrl = 'https://counselview.s6-tastewp.com/wp-admin/themes.php';

const username = 'admin';
const password = 'xYf3vt6Xvqw';

async function check() {
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

    console.log('Fetching themes page...');
    const themesRes = await fetch(themesPageUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const themesHtml = await themesRes.text();
    console.log('--- THEMES PAGE OUTPUT (partial) ---');
    // Find all theme names/slugs in the HTML
    const themesMatch = themesHtml.match(/"name":"([^"]+)"/g);
    console.log('Installed Themes:', themesMatch);

    console.log('\nFetching plugins page...');
    const pluginsRes = await fetch(pluginsPageUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const pluginsHtml = await pluginsRes.text();
    console.log('--- PLUGINS PAGE OUTPUT (partial) ---');
    // Find plugin names
    const pluginsMatch = pluginsHtml.match(/class="plugin-title"><strong>([^<]+)<\/strong>/g);
    console.log('Installed Plugins:', pluginsMatch ? pluginsMatch.map(p => p.replace(/class="plugin-title"><strong>/,'').replace(/<\/strong>/,'')) : 'None');

  } catch (e) {
    console.error('Error checking site:', e);
  }
}

check();
