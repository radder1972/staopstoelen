const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const adminUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/index.php';

async function testLoginAndFetchAdmin() {
  const params = new URLSearchParams();
  params.append('log', 'admin');
  params.append('pwd', '7jfZUrib4xY');
  params.append('wp-submit', 'Log In');
  params.append('redirect_to', adminUrl);
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
    console.log('Using cookies for auth:', cookieHeader);

    // Fetch the admin dashboard page
    const adminRes = await fetch(adminUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await adminRes.text();
    console.log('Admin Page Response Status:', adminRes.status);
    if (bodyText.includes('Dashboard') || bodyText.includes('wp-admin-bar')) {
      console.log('Success! We are logged in as admin!');
    } else {
      console.log('Failed to access admin. Body snippet:', bodyText.substring(0, 500));
    }
  } catch (err) {
    console.error('Error during authenticated request:', err);
  }
}

testLoginAndFetchAdmin();
