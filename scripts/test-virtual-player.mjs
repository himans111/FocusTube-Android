import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "tube-player/index.html"), "utf8");
const artifacts = path.join(root, "browser-test-artifacts");
fs.mkdirSync(artifacts, { recursive: true });

const server = http.createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  response.end(html);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = "http://127.0.0.1:" + address.port + "/";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const failures = [];

try {
  const viewports = [
    { name: "phone-360x800", width: 360, height: 800, mobile: true },
    { name: "phone-390x844", width: 390, height: 844, mobile: true },
    { name: "tablet-768x1024", width: 768, height: 1024, mobile: true },
    { name: "landscape-phone-844x390", width: 844, height: 390, mobile: true },
    { name: "laptop-1366x768", width: 1366, height: 768, mobile: false },
    { name: "desktop-1920x1080", width: 1920, height: 1080, mobile: false }
  ];

  for (const item of viewports) {
    const context = await browser.newContext({
      viewport: { width: item.width, height: item.height },
      deviceScaleFactor: 1,
      isMobile: item.mobile,
      hasTouch: item.mobile
    });
    const page = await context.newPage();
    page.on("pageerror", error => failures.push(item.name + ": page error: " + error.message));
    await page.route("https://**", route => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    }));
    await page.goto(baseUrl + "?video=dQw4w9WgXcQ", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      window.YT = {
        Player: function (id, config) {
          const host = document.getElementById(id);
          const iframe = document.createElement("iframe");
          iframe.id = "mock-youtube-iframe";
          iframe.title = "Mock YouTube player";
          host.replaceWith(iframe);
          const target = {
            getIframe: () => iframe,
            setSize: (width, height) => {
              iframe.style.width = width + "px";
              iframe.style.height = height + "px";
              iframe.width = String(width);
              iframe.height = String(height);
            },
            unMute() {},
            setVolume() {},
            playVideo() {}
          };
          window.__mockPlayer = target;
          queueMicrotask(() => config.events.onReady({ target }));
        }
      };
      window.onYouTubeIframeAPIReady();
    });
    await page.waitForSelector("#mock-youtube-iframe");
    await page.waitForTimeout(80);

    const initial = await page.evaluate(() => {
      const stage = document.querySelector("#player-stage").getBoundingClientRect();
      const frame = document.querySelector("#video-frame");
      return {
        stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height },
        frame: { width: frame.clientWidth, height: frame.clientHeight }
      };
    });
    assert.ok(Math.abs((initial.stage.x + initial.stage.width / 2) - item.width / 2) <= 1,
      item.name + ": normal player is not horizontally centered: " + JSON.stringify(initial.stage));
    assert.ok(Math.abs((initial.stage.y + initial.stage.height / 2) - item.height / 2) <= 1,
      item.name + ": normal player is not vertically centered: " + JSON.stringify(initial.stage));
    assert.ok(initial.frame.width >= 200 && initial.frame.height >= 200,
      item.name + ": YouTube minimum viewport is not met: " + JSON.stringify(initial.frame));

    assert.equal(await page.locator("#fullscreen-button").getAttribute("aria-hidden"), "true",
      item.name + ": controls should begin hidden");
    await page.locator("#tap-shield").click({ position: { x: 20, y: 20 } });
    assert.equal(await page.locator("#fullscreen-button").getAttribute("aria-hidden"), "false",
      item.name + ": touch did not reveal controls");
    await page.waitForTimeout(2600);
    assert.equal(await page.locator("#fullscreen-button").getAttribute("aria-hidden"), "true",
      item.name + ": controls did not auto-hide");
    await page.locator("#tap-shield").click({ position: { x: 20, y: 20 } });
    await page.locator("#fullscreen-button").evaluate(button => button.click());
    await page.waitForTimeout(100);

    const full = await page.evaluate(() => {
      const stage = document.querySelector("#player-stage");
      const frame = document.querySelector("#video-frame");
      const stageRect = stage.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const iframe = document.querySelector("#mock-youtube-iframe");
      return {
        active: stage.classList.contains("virtual-fullscreen"),
        rotated: stage.classList.contains("virtual-rotated"),
        stage: { x: stageRect.x, y: stageRect.y, width: stageRect.width, height: stageRect.height },
        frame: { x: frameRect.x, y: frameRect.y, width: frameRect.width, height: frameRect.height,
                 layoutWidth: frame.clientWidth, layoutHeight: frame.clientHeight },
        iframe: { width: parseFloat(iframe.style.width), height: parseFloat(iframe.style.height) }
      };
    });
    assert.equal(full.active, true, item.name + ": virtual fullscreen did not activate");
    assert.equal(full.rotated, item.height > item.width, item.name + ": rotation state is incorrect");
    assert.ok(full.frame.x <= 1 && full.frame.x + full.frame.width >= item.width - 1,
      item.name + ": video does not cover viewport width: " + JSON.stringify(full));
    assert.ok(full.frame.y <= 1 && full.frame.y + full.frame.height >= item.height - 1,
      item.name + ": video does not cover viewport height: " + JSON.stringify(full));
    assert.ok(Math.abs(full.iframe.width - full.frame.layoutWidth) <= 1,
      item.name + ": YouTube iframe width does not match layout width: " + JSON.stringify(full));
    assert.ok(Math.abs(full.iframe.height - full.frame.layoutHeight) <= 1,
      item.name + ": YouTube iframe height does not match layout height: " + JSON.stringify(full));

    await page.screenshot({ path: path.join(artifacts, item.name + ".png") });
    await page.locator("#fullscreen-button").evaluate(button => button.click());
    const restored = await page.evaluate(() => {
      const r = document.querySelector("#player-stage").getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    assert.ok(Math.abs((restored.x + restored.width / 2) - item.width / 2) <= 1,
      item.name + ": exiting fullscreen did not restore horizontal centering");
    assert.ok(Math.abs((restored.y + restored.height / 2) - item.height / 2) <= 1,
      item.name + ": exiting fullscreen did not restore vertical centering");

    console.log("PASS " + item.name + ": centered mini-player, touch controls, cover-fit virtual landscape and iframe sizing");
    await context.close();
  }
} catch (error) {
  failures.push(error.stack || error.message || String(error));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log("PASS: all six Chromium viewport regression cases.");
}
