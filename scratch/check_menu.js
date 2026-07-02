const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const adminUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/index.php';

const username = 'admin';
const password = '7jfZUrib4xY';

async function checkAdminMenu() {
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

    const adminRes = await fetch(adminUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await adminRes.text();
    
    // Find all links containing page= in the admin menu
    const menuRegex = /href="admin\.php\?page=([^"]+)"/g;
    let match;
    const menuPages = [];
    while ((match = menuRegex.exec(bodyText)) !== null) {
      menuPages.push(match[1]);
    }
    console.log('Admin menu pages (admin.php?page=...):', menuPages);

  } catch (err) {
    console.error('Error reading admin menu:', err);
  }
}

checkAdminMenu();
