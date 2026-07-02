const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const searchPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugin-install.php?tab=search&s=woocommerce';

async function findLinks() {
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

    const searchRes = await fetch(searchPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await searchRes.text();
    
    // Let's print any href containing "install-plugin"
    const regex = /href="([^"]*action=install-plugin[^"]*)"/g;
    let match;
    console.log('Matches found for "action=install-plugin":');
    while ((match = regex.exec(bodyText)) !== null) {
      console.log(match[1]);
    }
  } catch (err) {
    console.error('Error finding links:', err);
  }
}

findLinks();
