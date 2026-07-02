const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const pluginsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugins.php';

const username = 'admin';
const password = '7jfZUrib4xY';

async function activatePlugins() {
  console.log('Logging in to TasteWP...');
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

    // 1. Fetch plugins page to extract activation links
    console.log('Fetching plugins page...');
    const pluginsRes = await fetch(pluginsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const pluginsHtml = await pluginsRes.text();
    
    // Find all activation links
    // The link format can be: plugins.php?action=activate&amp;plugin=slug%2Ffile.php&amp;_wpnonce=nonce
    // or plugins.php?action=activate&#038;plugin=slug%2Ffile.php&#038;_wpnonce=nonce
    const activationRegex = /href="([^"]*action=activate[^"]*)"/g;
    let match;
    const activationUrls = [];

    while ((match = activationRegex.exec(pluginsHtml)) !== null) {
      let actUrl = match[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
      if (!actUrl.startsWith('http')) {
        actUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/' + actUrl;
      }
      activationUrls.push(actUrl);
    }

    console.log(`Found ${activationUrls.length} total activation links.`);

    const targets = ['woocommerce', 'advanced-custom-fields', 'code-snippets'];

    for (const urlStr of activationUrls) {
      const url = new URL(urlStr);
      const pluginParam = url.searchParams.get('plugin');
      
      if (pluginParam) {
        const slug = pluginParam.split('/')[0];
        if (targets.includes(slug)) {
          console.log(`Activating target plugin: ${slug}...`);
          const actRes = await fetch(urlStr, {
            headers: {
              'Cookie': cookieHeader,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          console.log(`Activation of ${slug} request returned status: ${actRes.status}`);
        }
      }
    }

    // Verify activation
    console.log('\nVerifying activation...');
    const verifyRes = await fetch(pluginsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const verifyHtml = await verifyRes.text();
    // Look for active rows: <tr class="active" data-slug="slug">
    const activeRegex = /<tr class="active[^"]*"[^>]*data-slug="([^"]+)"/g;
    const activeSlugs = [];
    let activeMatch;
    while ((activeMatch = activeRegex.exec(verifyHtml)) !== null) {
      activeSlugs.push(activeMatch[1]);
    }
    
    console.log('Active plugins now:', activeSlugs);
    
  } catch (err) {
    console.error('Error activating plugins:', err);
  }
}

activatePlugins();
