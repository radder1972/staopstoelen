const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_PATH = '/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1';
const PORT = 9395;
const FPS = 30;

const SCENES = [
  {
    idx: 0,
    audio: 'assets/audio/consumer_scene_1.m4a',
    duration: 12.80,
    outVideo: 'assets/video/scene1_dilemma.mp4',
    name: 'Scene 1: Het Senioren-Dilemma'
  },
  {
    idx: 1,
    audio: 'assets/audio/consumer_scene_2.m4a',
    duration: 13.00,
    outVideo: 'assets/video/scene2_showroom.mp4',
    name: 'Scene 2: Certified Fitform De Sweet Spot'
  },
  {
    idx: 2,
    audio: 'assets/audio/consumer_scene_3.m4a',
    duration: 14.60,
    outVideo: 'assets/video/scene3_werkplaats.mp4',
    name: 'Scene 3: 15-Punts Keuring & Maatwerk'
  },
  {
    idx: 3,
    audio: 'assets/audio/consumer_scene_4.m4a',
    duration: 14.00,
    outVideo: 'assets/video/scene4_zekerheid.mp4',
    name: 'Scene 4: Kom Proefzitten in de Showroom Dordrecht'
  }
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Authentic Bedrijfsvideo Recording (Waarom Certified Fitform - zoom 1.50)...');
  fs.mkdirSync('assets/video', { recursive: true });

  const url = `http://localhost:8088/certified-fitform-video.html?mode=consumer&record=1`;
  const chromeProc = exec(`"${CHROME_PATH}" --headless=new --user-data-dir=/tmp/chrome_${PORT} --remote-debugging-port=${PORT} --disable-gpu --window-size=1920,1080 "${url}"`);

  // Retry connecting to Chrome CDP for up to 15 seconds
  let tabs = null;
  const maxRetries = 30;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await wait(500);
    try {
      tabs = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${PORT}/json`, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      if (tabs && tabs.length > 0) break;
    } catch (e) {
      if (attempt === maxRetries) {
        chromeProc.kill();
        throw new Error(`Failed to connect to Chrome at http://127.0.0.1:${PORT}/json after ${maxRetries} attempts: ${e.message}`);
      }
    }
  }

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

  // Ensure scene 0 is ready
  await send('Runtime.evaluate', {
    expression: 'window.jumpToScene(0, 0); document.title;'
  });
  await wait(500);

  const totalStartTime = Date.now();

  let scenesToRecord = SCENES;
  if (process.argv.includes('--scenes-34')) {
    scenesToRecord = SCENES.filter(s => s.idx === 2 || s.idx === 3);
  } else if (process.argv.includes('--scene3-only')) {
    scenesToRecord = SCENES.filter(s => s.idx === 2);
  } else if (process.argv.includes('--scene2-only')) {
    scenesToRecord = SCENES.filter(s => s.idx === 1);
  }

  for (const scene of scenesToRecord) {
    console.log(`\n🎬 Recording ${scene.name} (${scene.duration}s)...`);
    const numFrames = Math.ceil(scene.duration * FPS);
    const audioPath = path.resolve(scene.audio);
    const outVideoPath = path.resolve(scene.outVideo);

    // Initialize scene in browser
    await send('Runtime.evaluate', {
      expression: `window.setRecordingFrame(${scene.idx}, 0, ${scene.duration});`
    });
    await wait(300);

    const ffmpegArgs = [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', String(FPS),
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

    const ffmpegProc = spawn(FFMPEG_PATH, ffmpegArgs);
    ffmpegProc.stderr.on('data', () => {});
    ffmpegProc.stdin.on('error', (err) => {
      if (err.code !== 'EPIPE') console.warn('FFmpeg stdin warning:', err.message);
    });

    const sceneStartTime = Date.now();

    for (let frame = 0; frame < numFrames; frame++) {
      if (!ffmpegProc.stdin.writable) {
        break;
      }
      const timeSec = frame / FPS;

      await send('Runtime.evaluate', {
        expression: `window.setRecordingFrame(${scene.idx}, ${timeSec.toFixed(3)}, ${scene.duration});`
      });

      const shot = await send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 92
      });

      const imgBuf = Buffer.from(shot.data, 'base64');
      if (ffmpegProc.stdin.writable) {
        const canWrite = ffmpegProc.stdin.write(imgBuf);
        if (!canWrite) {
          await new Promise(r => ffmpegProc.stdin.once('drain', r));
        }
      }

      if (frame % 30 === 0 || frame === numFrames - 1) {
        process.stdout.write(`  Frame ${frame + 1}/${numFrames} (${Math.round((frame + 1) / numFrames * 100)}%)\r`);
      }
    }

    console.log('\n  Flushing stream to FFmpeg...');
    if (ffmpegProc.stdin.writable) {
      ffmpegProc.stdin.end();
    }

    await new Promise((resolve, reject) => {
      ffmpegProc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg exited with code ${code}`));
      });
    });

    const elapsed = ((Date.now() - sceneStartTime) / 1000).toFixed(1);
    console.log(`  Rendered ${scene.outVideo} in ${elapsed}s`);
  }

  ws.close();
  chromeProc.kill();

  console.log('\n Concatenating 4 authentic scenes into master bedrijfsvideo...');
  const concatContent = SCENES.map(s => `file '${path.resolve(s.outVideo)}'`).join('\n') + '\n';
  fs.writeFileSync('scripts/concat_bedrijfsvideo_authentic.txt', concatContent);

  const masterPath = 'assets/video/staopstoelen_bedrijfsvideo_dordrecht.mp4';
  const concatArgs = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', 'scripts/concat_bedrijfsvideo_authentic.txt',
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

  // Extract poster frame at 16s (Scene 2: Living room Fitform chair + intact Certified Fitform sticker!)
  console.log('📸 Extracting authentic 1080p poster frame...');
  const posterArgs = [
    '-y',
    '-ss', '00:00:16.000',
    '-i', masterPath,
    '-vframes', '1',
    '-q:v', '2',
    'assets/video/video_poster_scene2.jpg'
  ];
  await new Promise((resolve, reject) => {
    const pp = spawn(FFMPEG_PATH, posterArgs);
    pp.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Poster extraction failed with code ${code}`));
    });
  });

  const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(1);
  console.log(`\n🎉 ALL DONE in ${totalTime}s! Authentic bedrijfsvideo and poster successfully created!`);
  process.exit(0);
}

main().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
