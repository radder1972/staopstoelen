const loginUrl = 'https://counselview.s6-tastewp.com/wp-login.php';
const themesPageUrl = 'https://counselview.s6-tastewp.com/wp-admin/themes.php';

const username = 'admin';
const password = 'xYf3vt6Xvqw';

async function activate() {
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

    console.log('Fetching themes page to extract active nonces...');
    const themesRes = await fetch(themesPageUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const themesHtml = await themesRes.text();

    const settingsMatch = themesHtml.match(/var _wpThemeSettings = (\{[\s\S]+?\});/);
    if (settingsMatch) {
      const settings = JSON.parse(settingsMatch[1]);
      console.log('Found themes in settings:', settings.themes.map(t => t.id));
      
      const targetTheme = settings.themes.find(t => t.id === 'staopstoelen-theme');
      if (targetTheme && targetTheme.actions && targetTheme.actions.activate) {
        let activateUrl = targetTheme.actions.activate;
        // Decode HTML entities
        activateUrl = activateUrl.replace(/&amp;/g, '&').replace(/&#038;/g, '&');
        console.log('Found fresh activation URL:', activateUrl);

        console.log('Activating Staopstoelen Theme...');
        const actRes = await fetch(activateUrl, {
          headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('Activation response status:', actRes.status);
        
        // Fetch front page to verify
        const verifyRes = await fetch('https://counselview.s6-tastewp.com/', {
          headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
        });
        const verifyHtml = await verifyRes.text();
        if (verifyHtml.includes('Gereviseerde Sta-op Stoelen')) {
          console.log(' -> SUCCESS! Staopstoelen Theme is now active and homepage is loading!');
        } else {
          console.log(' -> Theme activated, but homepage did not verify yet. Check layout manually.');
        }
      } else {
        console.error(' -> ERROR: staopstoelen-theme was not found in installed themes list.');
      }
    } else {
      console.error('Could not find _wpThemeSettings in response HTML.');
    }
  } catch (e) {
    console.error('Error during activation:', e);
  }
}

activate();
