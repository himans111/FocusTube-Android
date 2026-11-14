import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const htmlPath = path.join(root, "tube-player/index.html");
const shortPath = path.join(root, "p/index.html");
const cacheBustPath = path.join(root, "p2/index.html");
const freshPath = path.join(root, "p3/index.html");
if (!fs.existsSync(htmlPath)) throw new Error("Missing " + htmlPath);
if (!fs.existsSync(shortPath)) throw new Error("Missing " + shortPath);
if (!fs.existsSync(cacheBustPath)) throw new Error("Missing " + cacheBustPath);
if (!fs.existsSync(freshPath)) throw new Error("Missing " + freshPath);

const html = fs.readFileSync(htmlPath, "utf8");
const shortHtml = fs.readFileSync(shortPath, "utf8");
const cacheBustHtml = fs.readFileSync(cacheBustPath, "utf8");
const freshHtml = fs.readFileSync(freshPath, "utf8");
if (html !== shortHtml || html !== cacheBustHtml || html !== freshHtml) {
  throw new Error("p/index.html, p2/index.html, p3/index.html and tube-player/index.html must be identical");
}

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((m) => !/\bsrc\s*=/.test(m[1]))
  .map((m) => m[2])
  .filter((s) => s.trim());
if (!scripts.length) throw new Error("No inline JavaScript found");

const required = [
  "#video-frame",
  "#video-frame > iframe",
  "player.setSize(Math.round(width), Math.round(height))",
  "const width = videoFrame.clientWidth",
  "const height = videoFrame.clientHeight",
  "#player-stage.virtual-fullscreen",
  "#player-stage.virtual-fullscreen.virtual-rotated #video-frame",
  "transform: rotate(90deg)",
  "--player-viewport-width",
  "--player-viewport-height",
  "--player-frame-width",
  "window.visualViewport",
  "new ResizeObserver",
  "setFullscreenUi(true)",
  "setFullscreenUi(false)",
  'id="tap-shield"',
  'tapShield.addEventListener("pointerup"',
  "setControlsVisible(false, false)",
  "controls-visible #fullscreen-button",
  "}, 2500);",
  "fs: 0",
  "allowfullscreen",
  "onAutoplayBlocked",
  "setVolume(100)",
  "beginHold",
  "initDataUnsafe",
  "setStatus"
];
for (const feature of required) {
  if (!html.includes(feature)) throw new Error("Missing required feature: " + feature);
}

const forbidden = [
  "requestFullscreen(",
  "document.exitFullscreen",
  "fullscreenChanged",
  "fullscreenFailed",
  "screen.orientation",
  "orientation.lock",
  "telegram.isFullscreen",
  "telegram.requestFullscreen",
  "telegram.exitFullscreen",
  "document.fullscreenElement",
  "Media-first Mini App",
  "telegram.lockOrientation()"
];
for (const feature of forbidden) {
  if (html.includes(feature)) throw new Error("Obsolete fullscreen logic remains: " + feature);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "player-check-"));
try {
  scripts.forEach((source, i) => {
    const file = path.join(dir, "inline-" + i + ".js");
    fs.writeFileSync(file, source);
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || "JavaScript syntax error");
  });
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

// Geometry checks for portrait and landscape viewports from mobile through desktop.
for (const [vw, vh] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]]) {
  const isPortrait = vh > vw;
  const landscapeWidth = Math.min(isPortrait ? vh : vw, isPortrait ? vw * 16 / 9 : vh * 16 / 9);
  const videoHeight = landscapeWidth * 9 / 16;
  const renderedWidth = isPortrait ? videoHeight : landscapeWidth;
  const renderedHeight = isPortrait ? landscapeWidth : videoHeight;
  if (renderedWidth > vw + 0.01 || renderedHeight > vh + 0.01) {
    throw new Error("Virtual landscape geometry overflows viewport " + vw + "x" + vh);
  }
  if (Math.abs(landscapeWidth / videoHeight - 16 / 9) > 0.0001) {
    throw new Error("Virtual landscape aspect ratio changed for " + vw + "x" + vh);
  }
}
console.log("PASS: website-only virtual landscape, multi-size geometry, responsive resizing, touch-to-reveal auto-hide, identical routes and JS syntax.");
