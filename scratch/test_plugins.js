const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const installPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugin-install.php';

async function getUpdatesSettings() {
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

    // Fetch plugin install page
    const installRes = await fetch(installPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await installRes.text();
    
    const settingsMatch = bodyText.match(/var _wpUpdatesSettings = (\{[^;]+\});/);
    if (settingsMatch) {
      console.log('Found _wpUpdatesSettings:', settingsMatch[1]);
    } else {
      console.log('_wpUpdatesSettings not found in body!');
      // Let's print any occurrences of "updates" or "Nonce"
      const lines = bodyText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('ajax') || lines[i].includes('Nonce') || lines[i].includes('updates')) {
          if (lines[i].length < 200) {
            console.log(`Line ${i}: ${lines[i].trim()}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching updates settings:', err);
  }
}

getUpdatesSettings();
