const { exec, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 9331;
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg";

const FRAMES_DIR = path.resolve("assets/marketing/video_frames/scene_3");
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const DURATION = 17.97; // seconds matching Alexander voiceover
const FPS = 25;
const TOTAL_FRAMES = Math.round(DURATION * FPS); // 449 frames

console.log(`🎬 Rendering Animated Fruitmachine Scene (${DURATION}s @ ${FPS}fps = ${TOTAL_FRAMES} frames)...`);

const proc = exec(`"${CHROME_PATH}" --headless=new --user-data-dir=/tmp/chrome_${PORT} --remote-debugging-port=${PORT} --disable-gpu --window-size=1920,1080 "http://localhost:8080/assets/marketing/video_slides/animated_scene_fruitmachine.html"`);

setTimeout(async () => {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json`);
    const tabs = await res.json();
    const tab = tabs.find(t => t.type === "page") || tabs[0];
    const ws = new globalThis.WebSocket(tab.webSocketDebuggerUrl);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const parsed = JSON.parse(evt.data);
          if (parsed.id === id) {
            ws.removeEventListener("message", handler);
            if (parsed.error) reject(parsed.error);
            else resolve(parsed.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Wait a brief moment for fonts to load
    await new Promise(r => setTimeout(r, 600));

    console.log("✓ Connected to Chrome CDP. Starting frame capture...");
    const startTime = Date.now();

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const progress = f / (TOTAL_FRAMES - 1);
      
      // Step slot machine animation
      await send("Runtime.evaluate", {
        expression: `window.setAnimationProgress(${progress})`
      });

      // Capture frame
      const shot = await send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 88
      });

      const framePath = path.join(FRAMES_DIR, `frame_${String(f).padStart(5, '0')}.jpg`);
      fs.writeFileSync(framePath, Buffer.from(shot.data, "base64"));

      if (f % 50 === 0 || f === TOTAL_FRAMES - 1) {
        const pct = Math.round((f / TOTAL_FRAMES) * 100);
        console.log(`  [${pct}%] Frame ${f}/${TOTAL_FRAMES} (t = ${(progress * DURATION).toFixed(2)}s)`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ All ${TOTAL_FRAMES} frames captured in ${elapsed}s!`);

    ws.close();
    proc.kill();

    // Assemble with FFmpeg and mixed audio
    console.log("🎥 Encoding part_3.mp4 with FFmpeg and mixed casino sound effects...");
    const outMp4 = "assets/marketing/video_parts/part_3.mp4";
    const audioFile = "assets/marketing/video_audio/mixed_scene_3.mp3";

    const ffmpegCmd = [
      "-y",
      "-framerate", String(FPS),
      "-i", path.join(FRAMES_DIR, "frame_%05d.jpg"),
      "-i", audioFile,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      outMp4
    ];

    const ffRes = spawnSync(FFMPEG, ffmpegCmd, { stdio: "inherit" });
    if (ffRes.status === 0) {
      console.log(`🎉 SUCCESS! Fully animated Fruitmachine Scene rendered: ${outMp4}`);
    } else {
      console.error("❌ FFmpeg encoding failed.");
    }
    process.exit(0);

  } catch (err) {
    console.error("Error during rendering:", err);
    try { proc.kill(); } catch (e) {}
    process.exit(1);
  }
}, 1200);
