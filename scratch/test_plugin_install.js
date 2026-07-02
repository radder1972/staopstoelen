const fs = require('fs');
const path = require('path');

const loginUrl = 'https://counselview.s6-tastewp.com/wp-login.php';
const searchUrl = 'https://counselview.s6-tastewp.com/wp-admin/plugin-install.php?tab=search&s=woocommerce';

const username = 'admin';
const password = 'xYf3vt6Xvqw';

async function test() {
  console.log('Logging in...');
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
        'User-Agent': 'Mozilla/5.0'
      },
      body: params.toString(),
      redirect: 'manual'
    });

    const cookies = loginRes.headers.getSetCookie();
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    console.log('Searching for WooCommerce plugin...');
    const searchRes = await fetch(searchUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const searchHtml = await searchRes.text();
    
    // Look for update.php?action=install-plugin&plugin=woocommerce
    const regex = /href="([^"]*update\.php\?action=install-plugin[^"]*plugin=woocommerce[^"]*)"/;
    const match = searchHtml.match(regex);
    if (match) {
      const rawUrl = match[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
      console.log('Found WooCommerce install link:', rawUrl);
      
      console.log('Requesting installation...');
      const installRes = await fetch(rawUrl, {
        headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
      });
      const installHtml = await installRes.text();
      console.log('Installation page response code:', installRes.status);
      if (installHtml.includes('Plugin installed successfully')) {
        console.log(' -> WooCommerce installed successfully!');
      } else {
        console.log(' -> Installation finished, response contents:');
        console.log(installHtml.substring(0, 1000));
      }
    } else {
      console.error('WooCommerce install link not found in search results!');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
