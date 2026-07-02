const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const pluginsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugins.php';

const username = 'admin';
const password = '7jfZUrib4xY';

async function checkPluginsHtml() {
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
    
    // Find all table row IDs in the plugins table (format: data-slug="woocommerce" or id="woocommerce")
    const matches = pluginsHtml.match(/data-slug="([^"]+)"/g);
    console.log('Installed plugin slugs (data-slug):', matches);

    // Let's also print all strong tags inside plugin-title column
    const titleMatches = [];
    const titleRegex = /<td class="plugin-title[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>/g;
    let titleMatch;
    while ((titleMatch = titleRegex.exec(pluginsHtml)) !== null) {
      titleMatches.push(titleMatch[1].trim());
    }
    console.log('Installed plugin names (strong):', titleMatches);

  } catch (err) {
    console.error('Error checking plugins:', err);
  }
}

checkPluginsHtml();
