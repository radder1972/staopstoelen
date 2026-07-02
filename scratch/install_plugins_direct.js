const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const searchBaseUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugin-install.php?tab=search&s=';

const username = 'admin';
const password = '7jfZUrib4xY';

async function installPlugins() {
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

    // We search for these plugins. We will search for 'code-snippets' by searching 'code snippets'
    const plugins = [
      { slug: 'woocommerce', search: 'woocommerce' },
      { slug: 'advanced-custom-fields', search: 'advanced custom fields' },
      { slug: 'code-snippets', search: 'code snippets' }
    ];

    for (const p of plugins) {
      console.log(`\n--- Processing slug: ${p.slug} ---`);
      const searchUrl = searchBaseUrl + encodeURIComponent(p.search);
      
      const searchRes = await fetch(searchUrl, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const bodyText = await searchRes.text();
      
      // Strict matching: plugin=slug followed immediately by & or &#038; or "
      const regex = new RegExp(`href="([^"]*action=install-plugin[^"]*plugin=${p.slug}(?:&|&#038;|"))"`);
      const match = bodyText.match(regex);
      
      if (match) {
        let installUrl = match[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
        if (!installUrl.startsWith('http')) {
          installUrl = 'https://sweetstory.s6-tastewp.com' + installUrl;
        }
        console.log(`Found exact install URL for ${p.slug}: ${installUrl}`);
        
        console.log(`Triggering installation of ${p.slug}...`);
        const installRes = await fetch(installUrl, {
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`Installation page response status: ${installRes.status}`);
        const responseBody = await installRes.text();
        if (responseBody.includes('Plugin geïnstalleerd') || responseBody.includes('successfully installed') || responseBody.includes('Plugin installed successfully') || responseBody.includes('install-success')) {
          console.log(`SUCCESS: ${p.slug} has been installed!`);
        } else {
          console.log(`Check output (truncated):`, responseBody.substring(0, 400).replace(/\s+/g, ' '));
        }
      } else {
        console.log(`Could not find install link for ${p.slug} on search page.`);
      }
    }
  } catch (err) {
    console.error('Error during plugin installation:', err);
  }
}

installPlugins();
