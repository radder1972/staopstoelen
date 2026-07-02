const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const editorUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/theme-editor.php';

async function getEditorPage() {
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

    // Fetch theme editor page
    const editorRes = await fetch(editorUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await editorRes.text();
    console.log('Editor Page Status:', editorRes.status);
    
    // Find theme, file, and _wpnonce
    const nonceMatch = bodyText.match(/name="_wpnonce" value="([^"]+)"/);
    console.log('Nonce match:', nonceMatch ? nonceMatch[1] : 'not found');

    const themeMatch = bodyText.match(/name="theme" value="([^"]+)"/);
    console.log('Theme match:', themeMatch ? themeMatch[1] : 'not found');

    const fileMatch = bodyText.match(/name="file" value="([^"]+)"/);
    console.log('File match:', fileMatch ? fileMatch[1] : 'not found');

    if (bodyText.includes('newcontent')) {
      console.log('Theme File Editor is enabled and writable!');
    } else {
      console.log('Theme File Editor is NOT enabled or writable on this site.');
    }
  } catch (err) {
    console.error('Error fetching editor page:', err);
  }
}

getEditorPage();
