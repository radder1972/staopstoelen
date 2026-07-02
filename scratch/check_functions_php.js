const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const editorUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/theme-editor.php?file=functions.php&theme=twentytwentythree';

const username = 'admin';
const password = '7jfZUrib4xY';

async function checkFunctionsPhp() {
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

    const editorRes = await fetch(editorUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await editorRes.text();
    console.log('Functions.php Editor Status:', editorRes.status);
    if (bodyText.includes('newcontent')) {
      console.log('functions.php exists and is writable!');
      // Let's print the current content of the file
      const textareaMatch = bodyText.match(/<textarea[^>]*id="newcontent"[^>]*>([\s\S]*?)<\/textarea>/);
      if (textareaMatch) {
        console.log('Current content length:', textareaMatch[1].length);
      }
    } else {
      console.log('functions.php does NOT exist or is not writable in this theme.');
    }
  } catch (err) {
    console.error('Error checking functions.php:', err);
  }
}

checkFunctionsPhp();
