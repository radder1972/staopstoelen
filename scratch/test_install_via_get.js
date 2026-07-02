const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const searchPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugin-install.php?tab=search&s=woocommerce';

async function findInstallLink() {
  const params = new URLSearchParams();
  params.append('log', 'admin');
  params.append('pwd', '7jfZUrib4xY');
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

    // Fetch plugin search page
    console.log('Searching for woocommerce...');
    const searchRes = await fetch(searchPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await searchRes.text();
    console.log('Search page loaded.');

    // Look for installation links
    const installRegex = /href="([^"]*action=install-plugin[^"]*)"/g;
    let match;
    const links = [];
    while ((match = installRegex.exec(bodyText)) !== null) {
      links.push(match[1].replace(/&amp;/g, '&'));
    }

    console.log('Found install links:', links);
  } catch (err) {
    console.error('Error finding install link:', err);
  }
}

findInstallLink();
