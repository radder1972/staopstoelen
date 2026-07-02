const fs = require('fs');
const path = require('path');

const loginUrl = 'https://counselview.s6-tastewp.com/wp-login.php';
const themesPageUrl = 'https://counselview.s6-tastewp.com/wp-admin/themes.php';

const username = 'admin';
const password = 'xYf3vt6Xvqw';

async function checkTheme() {
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

    const themesRes = await fetch(themesPageUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const themesHtml = await themesRes.text();
    
    fs.writeFileSync(path.join(__dirname, 'themes_page.html'), themesHtml, 'utf8');

    if (themesHtml.includes('Staopstoelen Theme') || themesHtml.includes('staopstoelen-theme')) {
      console.log(' -> SUCCESS! The custom theme "Staopstoelen Theme" is installed!');
      
      // Let's check if it is active
      // Active theme is usually designated by class="theme active" or within _wpThemeSettings
      // In wpThemeSettings: "active":true
      const settingsMatch = themesHtml.match(/var _wpThemeSettings = (\{[^;]+\});/);
      if (settingsMatch) {
        const settings = JSON.parse(settingsMatch[1]);
        const activeTheme = settings.themes.find(t => t.active);
        console.log('Active Theme Name:', activeTheme ? activeTheme.name : 'Unknown');
        console.log('Active Theme ID/Folder:', activeTheme ? activeTheme.id : 'Unknown');
      }
    } else {
      console.warn(' -> WARNING! The custom theme was NOT found on the themes page.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkTheme();
