const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const installPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugin-install.php';
const ajaxUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin-ajax.php';
const pluginsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugins.php';

const username = 'admin';
const password = '7jfZUrib4xY';

async function runSetup() {
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

    // 1. Get fresh installer nonce
    console.log('Fetching plugin install page to get fresh nonce...');
    const installRes = await fetch(installPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const installHtml = await installRes.text();
    const settingsMatch = installHtml.match(/var _wpUpdatesSettings = (\{[^;]+\});/);
    if (!settingsMatch) {
      console.error('Could not find _wpUpdatesSettings on install page!');
      return;
    }
    const { ajax_nonce: nonce } = JSON.parse(settingsMatch[1]);
    console.log('Fresh installer nonce obtained:', nonce);

    // 2. Install each plugin
    const pluginsToInstall = [
      { slug: 'woocommerce', name: 'WooCommerce' },
      { slug: 'advanced-custom-fields', name: 'Advanced Custom Fields' },
      { slug: 'code-snippets', name: 'Code Snippets' }
    ];

    for (const plugin of pluginsToInstall) {
      console.log(`Installing ${plugin.name} (${plugin.slug})...`);
      const ajaxParams = new URLSearchParams();
      ajaxParams.append('action', 'updates');
      ajaxParams.append('_ajax_nonce', nonce);
      ajaxParams.append('slug', plugin.slug);
      ajaxParams.append('type', 'plugin');

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: ajaxParams.toString()
      });

      const resJson = await response.json();
      console.log(`Install output for ${plugin.slug}:`, resJson);
    }

    // 3. Fetch plugins page to extract activation links
    console.log('Fetching plugins page to extract activation nonces...');
    const pluginsRes = await fetch(pluginsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const pluginsHtml = await pluginsRes.text();
    
    // Find all activation links
    // Format is plugins.php?action=activate&amp;plugin=woocommerce%2Fwoocommerce.php&amp;_wpnonce=xxxx
    const activationRegex = /plugins\.php\?action=activate&amp;plugin=([^&]+)&amp;_wpnonce=([a-z0-9]+)/g;
    let match;
    const activationUrls = [];

    while ((match = activationRegex.exec(pluginsHtml)) !== null) {
      const pluginFile = decodeURIComponent(match[1]);
      const activationNonce = match[2];
      activationUrls.push({
        pluginFile,
        url: `https://sweetstory.s6-tastewp.com/wp-admin/plugins.php?action=activate&plugin=${match[1]}&_wpnonce=${activationNonce}`
      });
    }

    console.log('Found activation URLs:', activationUrls);

    // Activate the ones we installed
    const pluginsToActivate = [
      'woocommerce/woocommerce.php',
      'advanced-custom-fields/acf.php',
      'code-snippets/code-snippets.php'
    ];

    for (const item of activationUrls) {
      if (pluginsToActivate.includes(item.pluginFile)) {
        console.log(`Activating ${item.pluginFile}...`);
        const actRes = await fetch(item.url, {
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log(`Activated ${item.pluginFile}. Status:`, actRes.status);
      }
    }

    console.log('Plugin installation and activation script completed!');

  } catch (err) {
    console.error('Error executing setup:', err);
  }
}

runSetup();
