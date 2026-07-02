const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const snippetsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin.php?page=add-snippet';

const username = 'admin';
const password = '7jfZUrib4xY';

async function checkMedia() {
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

    const pageRes = await fetch(snippetsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const pageHtml = await pageRes.text();
    const settingsMatch = pageHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    if (!settingsMatch) {
      console.error('Could not find REST nonce!');
      return;
    }
    const nonce = JSON.parse(settingsMatch[1]).restAPI.nonce;

    // Fetch media details
    const mediaRes = await fetch('https://sweetstory.s6-tastewp.com/wp-json/wp/v2/media/39', {
      headers: {
        'Cookie': cookieHeader,
        'X-WP-Nonce': nonce,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (mediaRes.ok) {
      const media = await mediaRes.json();
      console.log('Media 39 Source URL:', media.source_url);
    } else {
      console.error('Failed to fetch media:', mediaRes.status, await mediaRes.text());
    }

  } catch (err) {
    console.error('Error checking media:', err);
  }
}

checkMedia();
