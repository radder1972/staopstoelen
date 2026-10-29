const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = '/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';
const PORT = 9310;
const FPS = 30;

const SCENES = [
  {
    idx: 0,
    audio: 'assets/audio/afspraak_scene_1.m4a',
    duration: 10.56,
    outVideo: 'assets/video/afspraak_s1_waarom.mp4',
    name: 'Scene 1: Waarom een Sta-op Stoel op Maat Moet Passen'
  },
  {
    idx: 1,
    audio: 'assets/audio/afspraak_scene_2.m4a',
    duration: 12.33,
    outVideo: 'assets/video/afspraak_s2_zitmeting.mp4',
    name: 'Scene 2: Persoonlijke Zitmeting door Geertjan'
  },
  {
    idx: 2,
    audio: 'assets/audio/afspraak_scene_3.m4a',
    duration: 11.35,
    outVideo: 'assets/video/afspraak_s3_proefzitten.mp4',
    name: 'Scene 3: 30+ Stoelen Vrijblijvend Uitproberen'
  },
  {
    idx: 3,
    audio: 'assets/audio/afspraak_scene_4.m4a',
    duration: 10.98,
    outVideo: 'assets/video/afspraak_s4_afspraak.mp4',
    name: 'Scene 4: Gratis Parkeren voor de Deur in Dordrecht'
  }
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Authentic Video Recording for staopstoelen.nl...');
  fs.mkdirSync('assets/video', { recursive: true });

  const url = `http://localhost:8088/certified-fitform-video.html?mode=afspraak&record=1`;
  const chromeProc = exec(`"${CHROME_PATH}" --headless=new --remote-debugging-port=${PORT} --disable-gpu --window-size=1920,1080 "${url}"`);

  await wait(1800);

  const tabs = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const tab = tabs.find(t => t.url.includes('certified-fitform-video.html'));
  if (!tab) {
    chromeProc.kill();
    throw new Error('Could not find video player tab');
  }

  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let msgId = 0;
  const callbacks = {};
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && callbacks[msg.id]) {
      callbacks[msg.id](msg.result);
      delete callbacks[msg.id];
    }
  };

  function send(method, params = {}) {
    msgId++;
    const id = msgId;
    return new Promise(resolve => {
      callbacks[id] = resolve;
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(resolve => ws.onopen = resolve);
  console.log(' Connected to Chrome DevTools Protocol');

  // Override viewport to exact 1920x1080
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Ensure setRecordingFrame is available
  await send('Runtime.evaluate', {
    expression: 'window.jumpToScene(0, 0); document.title;'
  });
  await wait(500);

  const totalStartTime = Date.now();

  const scenesToRecord = process.argv.includes('--scene2-only') ? SCENES.filter(s => s.idx === 1) : SCENES;
  for (const scene of scenesToRecord) {
    console.log(`\n🎬 Recording ${scene.name} (${scene.duration}s)...`);
    const numFrames = Math.ceil(scene.duration * FPS);
    const audioPath = path.resolve(scene.audio);
    const outVideoPath = path.resolve(scene.outVideo);

    // Initialize scene in browser
    await send('Runtime.evaluate', {
      expression: `window.setRecordingFrame(${scene.idx}, 0, ${scene.duration});`
    });
    await wait(300); // Wait for background and fonts to settle

    // Launch FFmpeg process to receive mjpeg stream via stdin
    const ffmpegArgs = [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', String(FPS),
      '-i', '-',
      '-i', audioPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outVideoPath
    ];

    const ffmpegProc = spawn(FFMPEG_PATH, ffmpegArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
    let ffmpegErr = '';
    ffmpegProc.stderr.on('data', d => ffmpegErr += d.toString());
    ffmpegProc.stdin.on('error', (err) => {
      if (err.code !== 'EPIPE') console.warn('FFmpeg stdin warning:', err.message);
    });

    const sceneStart = Date.now();

    for (let f = 0; f < numFrames; f++) {
      if (!ffmpegProc.stdin.writable) {
        break;
      }
      const t = f / FPS;
      await send('Runtime.evaluate', {
        expression: `window.setRecordingFrame(${scene.idx}, ${t.toFixed(3)}, ${scene.duration});`
      });

      const snap = await send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 94
      });

      const buf = Buffer.from(snap.data, 'base64');
      if (ffmpegProc.stdin.writable) {
        const canWrite = ffmpegProc.stdin.write(buf);
        if (!canWrite) {
          await new Promise(r => ffmpegProc.stdin.once('drain', r));
        }
      }

      if ((f + 1) % 30 === 0 || f === numFrames - 1) {
        const pct = Math.round(((f + 1) / numFrames) * 100);
        process.stdout.write(`\r  Frame ${f + 1}/${numFrames} (${pct}%)`);
      }
    }

    console.log(`\n  Flushing stream to FFmpeg...`);
    if (ffmpegProc.stdin.writable) {
      ffmpegProc.stdin.end();
    }

    await new Promise((resolve, reject) => {
      ffmpegProc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}: ${ffmpegErr}`));
      });
    });

    const sceneDuration = ((Date.now() - sceneStart) / 1000).toFixed(1);
    console.log(`  Rendered ${scene.outVideo} in ${sceneDuration}s`);
  }

  ws.close();
  chromeProc.kill();

  console.log('\n Concatenating 4 authentic scenes into master video...');
  const concatList = SCENES.map(s => `file '${path.resolve(s.outVideo)}'`).join('\n');
  fs.writeFileSync('scripts/concat_afspraak_authentic.txt', concatList);

  const masterPath = 'assets/video/zitmeting_proefzitten_dordrecht.mp4';
  const concatArgs = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', 'scripts/concat_afspraak_authentic.txt',
    '-c', 'copy',
    masterPath
  ];

  await new Promise((resolve, reject) => {
    const cp = spawn(FFMPEG_PATH, concatArgs);
    cp.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Concat failed with code ${code}`));
    });
  });

  console.log(`  Master video generated: ${masterPath}`);

  // Extract poster frame at 12s (Scene 2: Geertjan in showroom with zitadvies formulier)
  console.log('📸 Extracting authentic 1080p poster frame...');
  const posterArgs = [
    '-y',
    '-ss', '00:00:12.000',
    '-i', masterPath,
    '-vframes', '1',
    '-q:v', '2',
    'assets/video/zitmeting_poster.jpg'
  ];
  await new Promise((resolve, reject) => {
    const pp = spawn(FFMPEG_PATH, posterArgs);
    pp.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Poster extraction failed with code ${code}`));
    });
  });

  const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(1);
  console.log(`\n🎉 ALL DONE in ${totalTime}s! Authentic video and poster successfully created!`);
}

main().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
