const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const pluginsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugins.php';

const username = 'admin';
const password = '7jfZUrib4xY';

async function checkPlugins() {
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: params.toString(),
      redirect: 'manual'
    });

    const cookies = loginRes.headers.getSetCookie();
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    const pluginsRes = await fetch(pluginsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const pluginsHtml = await pluginsRes.text();
    
    // Find all table row classes or names
    const pluginNames = [];
    const nameRegex = /<strong class="plugin-name">([^<]+)<\/strong>/g;
    let match;
    while ((match = nameRegex.exec(pluginsHtml)) !== null) {
      pluginNames.push(match[1].trim());
    }

    console.log('Currently installed plugins:', pluginNames);

  } catch (err) {
    console.error('Error checking plugins:', err);
  }
}

checkPlugins();
