import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const htmlPath = path.resolve("tube-player/index.html");
if (!fs.existsSync(htmlPath)) throw new Error("Missing " + htmlPath);
const html = fs.readFileSync(htmlPath, "utf8");
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((m) => !/\bsrc\s*=/.test(m[1]))
  .map((m) => m[2])
  .filter((s) => s.trim());
if (!scripts.length) throw new Error("No inline JavaScript found");
for (const feature of ["requestFullscreen", "exitFullscreen", "onAutoplayBlocked", "setVolume(100)", "beginHold", "initDataUnsafe"]) {
  if (!html.includes(feature)) throw new Error("Missing required feature: " + feature);
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
console.log("PASS: player HTML, required features, and inline JavaScript syntax.");
