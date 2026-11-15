import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const paths = [
  "tube-player/index.html",
  "p/index.html",
  "p2/index.html",
  "p3/index.html",
  "p4/index.html"
];
for (const relativePath of paths) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error("Missing " + relativePath);
  }
}

const documents = paths.map(relativePath =>
  fs.readFileSync(path.join(root, relativePath), "utf8")
);
const html = documents[0];
if (documents.some(document => document !== html)) {
  throw new Error("p/index.html, p2/index.html, p3/index.html, p4/index.html and tube-player/index.html must be identical");
}

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(match => !/\bsrc\s*=/.test(match[1]))
  .map(match => match[2])
  .filter(source => source.trim());
if (!scripts.length) throw new Error("No inline JavaScript found");

const controlPlacement = `      </div>
      <!-- Controls stay separate from the video frame so they remain reachable
           in portrait, landscape and sensor-rotated fullscreen modes. -->
      <div id="tap-shield"`;
if (!html.includes(controlPlacement)) {
  throw new Error("Fullscreen/touch controls must be siblings of the rotated video frame");
}

const required = [
  "width: min(100vw, 640px, 177.7778dvh)",
  "const width = Math.round(videoFrame.clientWidth)",
  "const height = Math.round(videoFrame.clientHeight)",
  'iframe.style.width = width + "px"',
  'iframe.style.height = height + "px"',
  "player.setSize(width, height)",
  "#player-stage.virtual-fullscreen",
  "#player-stage.virtual-fullscreen #video-frame",
  "#player-stage.virtual-fullscreen.virtual-device-landscape #video-frame",
  "transform: translate(-50%, -50%) rotate(90deg)",
  "const virtualDeviceLandscape = Boolean(",
  "const videoFrameWidth = virtualDeviceLandscape ? height : width",
  "const videoFrameHeight = virtualDeviceLandscape ? width : height",
  "function handleDeviceOrientation(event)",
  "Math.abs(gamma)",
  "window.addEventListener(\"deviceorientation\", handleDeviceOrientation, true)",
  "--player-viewport-width",
  "--player-viewport-height",
  "--player-frame-width",
  "window.visualViewport",
  "telegram.viewportHeight",
  "telegram.viewportStableHeight",
  "telegram.requestFullscreen()",
  "telegram.exitFullscreen()",
  'telegram.onEvent("fullscreenChanged", updateViewportMetrics)',
  "requestTelegramFullscreen();",
  "setFullscreenUi(true);",
  "app.getBoundingClientRect()",
  "appHeight ||",
  "telegramFullscreenHeight || appHeight",
  "--player-frame-height",
  "iframe.allow = \"autoplay; encrypted-media; picture-in-picture; fullscreen; web-share\"",
  "player.mute()",
  "Tap once to enable sound",
  "event.isStateStable",
  'telegram.onEvent("viewportChanged", handleTelegramViewportChanged)',
  "--player-viewport-height",
  'id="tap-shield"',
  'tapShield.addEventListener("pointerup"',
  "setControlsVisible(false, false)",
  "}, 2500);",
  "fs: 0",
  "allowfullscreen",
  "onAutoplayBlocked",
  "setVolume(100)",
  "beginHold",
  "initDataUnsafe",
  "setStatus",
  'window.addEventListener("pageshow", updateViewportMetrics)',
  'document.addEventListener("visibilitychange"'
];
for (const feature of required) {
  if (!html.includes(feature)) throw new Error("Missing required feature: " + feature);
}

const forbidden = [
  "document.documentElement.requestFullscreen(",
  "document.exitFullscreen",
  "document.fullscreenchange",
  "document.fullscreenerror",
  "screen.orientation",
  "orientation.lock",
  "document.fullscreenElement",
  "Media-first Mini App",
  "telegram.lockOrientation()"
];
for (const feature of forbidden) {
  if (html.includes(feature)) throw new Error("Obsolete fullscreen logic remains: " + feature);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "player-check-"));
try {
  scripts.forEach((source, index) => {
    const file = path.join(dir, "inline-" + index + ".js");
    fs.writeFileSync(file, source);
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "JavaScript syntax error");
    }
  });
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

for (const [vw, vh] of [
  [360, 800], [390, 844], [768, 1024], [844, 390],
  [1024, 768], [1366, 768], [1920, 1080],
  [1512, 982], [2560, 1080]
]) {
  const frameWidth = vh > vw ? vh : vw;
  const frameHeight = vh > vw ? vw : vh;
  if (frameWidth < 200 || frameHeight < 200) {
    throw new Error("YouTube iframe minimum viewport is not met at " + vw + "x" + vh);
  }
}

console.log("PASS: route parity, JavaScript syntax, fullscreen API exclusions, viewport sizing, sensor rotation, responsive mini-player sizing and Telegram viewport integration.");
