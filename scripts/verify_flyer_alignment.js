const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9226;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting Chrome on port", PORT);
  const filePath = "file://" + path.resolve("flyer-a5-liggend.html");
  const chromeProc = exec(`"${CHROME_PATH}" --headless=new --user-data-dir=/tmp/chrome_${PORT} --remote-debugging-port=${PORT} --disable-gpu --window-size=1400,1800 "${filePath}"`);

  let tabs = null;
  for (let attempt = 1; attempt <= 20; attempt++) {
    await wait(300);
    try {
      tabs = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${PORT}/json`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
      });
      if (tabs && tabs.length > 0) break;
    } catch(e) {}
  }

  if (!tabs || tabs.length === 0) {
    chromeProc.kill();
    throw new Error("Could not connect to Chrome CDP");
  }

  const tab = tabs.find(t => t.type === 'page') || tabs[0];
  console.log("Connected to page tab:", tab.id);

  const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const parsed = JSON.parse(evt.data);
        if (parsed.id === id) {
          ws.removeEventListener('message', handler);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("DOM.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1400,
    height: 1800,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Wait for rendering
  await wait(1200);

  // Alignment report
  const evalRes = await send("Runtime.evaluate", {
    expression: "JSON.stringify(updateAlignmentReport ? updateAlignmentReport() : 'no func', null, 2)",
    returnByValue: true
  });
  console.log("Alignment report result:\n", evalRes.result.value);

  // Capture #flyerBack
  const backNode = await send("Runtime.evaluate", {
    expression: "(() => { const el = document.getElementById('flyerBack'); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()",
    returnByValue: true
  });
  const clip = backNode.result.value;
  console.log("Clip flyerBack:", clip);

  const shotRes = await send("Page.captureScreenshot", {
    format: "png",
    clip: {
      x: clip.x,
      y: clip.y,
      width: clip.width,
      height: clip.height,
      scale: 1
    }
  });

  const buf = Buffer.from(shotRes.data, "base64");
  fs.writeFileSync("scratch/flyer_a5_back_verified.png", buf);
  console.log("Saved scratch/flyer_a5_back_verified.png (" + buf.length + " bytes)");

  const artifactDir = "/Users/matthiasradder/.gemini/antigravity/brain/976e468b-2936-4c84-aea7-90168d561c70";
  fs.writeFileSync(path.join(artifactDir, "flyer_a5_back_verified.png"), buf);
  console.log("Copied to artifacts!");

  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
