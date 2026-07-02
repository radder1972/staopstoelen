const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const snippetsUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin-ajax.php?action=code_snippets_add_snippet'; // Wait, let's also fetch the admin.php?page=add-snippet
const snippetsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin.php?page=add-snippet';

const username = 'admin';
const password = '7jfZUrib4xY';

const fs = require('fs');

async function dumpPage() {
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

    const res = await fetch(snippetsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await res.text();
    fs.writeFileSync('scratch/add_snippet_page.html', html);
    console.log('Saved add_snippet_page.html, size:', html.length);
  } catch (err) {
    console.error('Error dumping page:', err);
  }
}

dumpPage();
