const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const snippetsUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin.php?page=add-snippet';

const username = 'admin';
const password = '7jfZUrib4xY';

async function findSnippetNonce() {
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

    const snippetsRes = await fetch(snippetsUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await snippetsRes.text();
    
    // Look for any input tag with name="_wpnonce"
    const nonceRegex = /<input[^>]*name="_wpnonce"[^>]*value="([^"]+)"[^>]*>/i;
    const nonceRegexAlt = /<input[^>]*value="([^"]+)"[^>]*name="_wpnonce"[^>]*>/i;
    
    let nonce = null;
    let match = bodyText.match(nonceRegex);
    if (match) nonce = match[1];
    if (!nonce) {
      match = bodyText.match(nonceRegexAlt);
      if (match) nonce = match[1];
    }
    
    console.log('Snippet Nonce found:', nonce);

    // Let's also print the form tags found on this page
    const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
    let formMatch;
    let count = 0;
    while ((formMatch = formRegex.exec(bodyText)) !== null) {
      count++;
      console.log(`--- Form ${count} HTML length: ${formMatch[0].length} ---`);
      if (formMatch[0].includes('snippet') || formMatch[0].includes('code')) {
        console.log(`Form ${count} contains 'snippet' or 'code'!`);
        // Print snippet of form
        console.log(formMatch[0].substring(0, 500).replace(/\s+/g, ' '));
      }
    }

  } catch (err) {
    console.error('Error finding snippet nonce:', err);
  }
}

findSnippetNonce();
