const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const installPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/plugin-install.php';
const ajaxUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin-ajax.php';

async function testAjaxInstall() {
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

    // Fetch plugin install page to get fresh nonce
    const installRes = await fetch(installPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const bodyText = await installRes.text();
    const settingsMatch = bodyText.match(/var _wpUpdatesSettings = (\{[^;]+\});/);
    if (!settingsMatch) {
      console.log('No updates settings found');
      return;
    }
    const { ajax_nonce: nonce } = JSON.parse(settingsMatch[1]);
    console.log('Fresh installer nonce:', nonce);

    // Call admin-ajax.php to install the plugin via updates action
    const ajaxParams = new URLSearchParams();
    ajaxParams.append('action', 'updates');
    ajaxParams.append('_ajax_nonce', nonce);
    ajaxParams.append('slug', 'woocommerce');
    ajaxParams.append('type', 'plugin');

    console.log('Sending AJAX request...');
    const response = await fetch(ajaxUrl, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: ajaxParams.toString()
    });

    const resText = await response.text();
    console.log('AJAX Install Result:', resText);
  } catch (err) {
    console.error('Error during AJAX install:', err);
  }
}

testAjaxInstall();
