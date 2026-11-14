import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const htmlPath = path.join(root, "tube-player/index.html");
const shortPath = path.join(root, "p/index.html");
const cacheBustPath = path.join(root, "p2/index.html");
if (!fs.existsSync(htmlPath)) throw new Error("Missing " + htmlPath);
if (!fs.existsSync(shortPath)) throw new Error("Missing " + shortPath);
if (!fs.existsSync(cacheBustPath)) throw new Error("Missing " + cacheBustPath);

const html = fs.readFileSync(htmlPath, "utf8");
const shortHtml = fs.readFileSync(shortPath, "utf8");
const cacheBustHtml = fs.readFileSync(cacheBustPath, "utf8");
if (html !== shortHtml || html !== cacheBustHtml) {
  throw new Error("p/index.html, p2/index.html and tube-player/index.html must be identical");
}

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((m) => !/\bsrc\s*=/.test(m[1]))
  .map((m) => m[2])
  .filter((s) => s.trim());
if (!scripts.length) throw new Error("No inline JavaScript found");

const required = [
  "#video-frame",
  "#video-frame > iframe",
  "player.setSize(Math.round(rect.width), Math.round(rect.height))",
  "width: Math.round(initialFrame.width)",
  "#player-stage.fullscreen",
  "#player-stage:fullscreen",
  'stage.requestFullscreen({ navigationUI: "hide" })',
  "document.fullscreenElement === stage",
  'orientation.lock("landscape")',
  "aspect-ratio: 16 / 9",
  "display: grid",
  "telegram.requestFullscreen();",
  "telegram.exitFullscreen()",
  "requestLandscapeOrientationFromTap",
  "fullscreenChanged",
  "fullscreenFailed",
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
  "Media-first Mini App",
  "lockLandscapeOrientation",
  "telegram.lockOrientation()",
  "document.documentElement.requestFullscreen"
];
for (const feature of forbidden) {
  if (html.includes(feature)) throw new Error("Obsolete fullscreen logic remains: " + feature);
}

// The page must request Telegram fullscreen only from a real button click,
// not automatically on page load via a timer.
const startup = html.slice(html.lastIndexOf("      startPlayer();"));
if (startup.includes("telegram.requestFullscreen()")) {
  throw new Error("Fullscreen must not auto-request from the page-load block");
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

console.log("PASS: player HTML, identical deployment copies, responsive fullscreen frame, Telegram event flow, and inline JavaScript syntax.");
