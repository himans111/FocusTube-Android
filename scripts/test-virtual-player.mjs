import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "p4/index.html"), "utf8");
const artifacts = path.join(root, "browser-test-artifacts");
fs.mkdirSync(artifacts, { recursive: true });

const server = http.createServer((request, response) => {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(html);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = "http://127.0.0.1:" + address.port + "/";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});
const failures = [];

function approx(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    message + ": expected " + expected + ", got " + actual);
}

function assertCoverGeometry(geometry, width, height, name) {
  approx(geometry.frame.x + geometry.frame.width / 2, width / 2, 1,
    name + ": virtual landscape is not horizontally centered");
  approx(geometry.frame.y + geometry.frame.height / 2, height / 2, 1,
    name + ": virtual landscape is not vertically centered");
  assert.ok(geometry.frame.x <= 1 && geometry.frame.x + geometry.frame.width >= width - 1,
    name + ": video frame leaves an uncovered horizontal strip: " + JSON.stringify(geometry));
  assert.ok(geometry.frame.y <= 1 && geometry.frame.y + geometry.frame.height >= height - 1,
    name + ": video frame leaves an uncovered vertical strip: " + JSON.stringify(geometry));
  assert.ok(Math.abs(geometry.layout.width / geometry.layout.height - 16 / 9) < 0.02,
    name + ": source video frame lost its 16:9 ratio: " + JSON.stringify(geometry));
  approx(geometry.iframe.width, geometry.layout.width, 1,
    name + ": YouTube iframe width does not match its layout frame");
  approx(geometry.iframe.height, geometry.layout.height, 1,
    name + ": YouTube iframe height does not match its layout frame");
}

try {
  const viewports = [
    { name: "phone-360x800", width: 360, height: 800, mobile: true },
    { name: "phone-390x844", width: 390, height: 844, mobile: true },
    { name: "tablet-768x1024", width: 768, height: 1024, mobile: true },
    { name: "landscape-phone-844x390", width: 844, height: 390, mobile: true },
    { name: "landscape-tablet-1024x768", width: 1024, height: 768, mobile: true },
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
    page.on("pageerror", error => failures.push(
      item.name + ": page error: " + (error.stack || error.message)
    ));

    await page.addInitScript(() => {
      window.__telegramEvents = {};
      window.__telegramReady = false;
      window.__telegramExpanded = false;
      window.Telegram = {
        WebApp: {
          initDataUnsafe: { start_param: "dQw4w9WgXcQ" },
          viewportHeight: window.innerHeight,
          ready() { window.__telegramReady = true; },
          expand() { window.__telegramExpanded = true; },
          setHeaderColor() {},
          setBackgroundColor() {},
          onEvent(name, handler) { window.__telegramEvents[name] = handler; }
        }
      };
    });

    await page.route("https://telegram.org/js/telegram-web-app.js", route => route.fulfill({
      status: 200, contentType: "application/javascript", body: ""
    }));
    await page.route("https://www.youtube.com/iframe_api", route => route.fulfill({
      status: 200, contentType: "application/javascript", body: ""
    }));
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    const preflight = await page.evaluate(() => ({
      telegramStartParam: window.Telegram && window.Telegram.WebApp &&
        window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.start_param,
      callback: typeof window.onYouTubeIframeAPIReady,
      ready: window.__telegramReady
    }));
    assert.equal(preflight.telegramStartParam, "dQw4w9WgXcQ",
      item.name + ": Telegram test fixture was overwritten before the page booted");
    assert.equal(preflight.callback, "function",
      item.name + ": YouTube IFrame API callback was not registered");

    await page.evaluate(() => {
      window.YT = {
        Player: function (id, config) {
          const host = document.getElementById(id);
          const iframe = document.createElement("iframe");
          iframe.id = "mock-youtube-iframe";
          iframe.title = "Mock YouTube player";
          iframe.width = String(config.width);
          iframe.height = String(config.height);
          host.replaceWith(iframe);
          const target = {
            getIframe: () => iframe,
            setSize() {},
            unMute() {},
            setVolume() {},
            playVideo() {}
          };
          window.__mockPlayer = target;
          window.__mockPlayerConfig = config;
          queueMicrotask(() => config.events.onReady({ target }));
          return target;
        }
      };
      window.onYouTubeIframeAPIReady();
    });
    await page.waitForSelector("#mock-youtube-iframe");
    await page.waitForTimeout(100);

    const boot = await page.evaluate(() => ({
      ready: window.__telegramReady,
      expanded: window.__telegramExpanded,
      viewportListener: typeof window.__telegramEvents.viewportChanged === "function",
      videoId: window.__mockPlayerConfig && window.__mockPlayerConfig.videoId,
      fullscreenParam: window.__mockPlayerConfig &&
        window.__mockPlayerConfig.playerVars.fs
    }));
    assert.equal(boot.ready, true, item.name + ": Telegram ready() was not called");
    assert.equal(boot.expanded, true, item.name + ": Telegram expand() was not called");
    assert.equal(boot.viewportListener, true, item.name + ": Telegram viewportChanged listener missing");
    assert.equal(boot.videoId, "dQw4w9WgXcQ", item.name + ": Telegram start_param was not parsed");
    assert.equal(boot.fullscreenParam, 0, item.name + ": expected website-owned fullscreen control");

    const initial = await page.evaluate(() => {
      const stage = document.querySelector("#player-stage").getBoundingClientRect();
      const frame = document.querySelector("#video-frame");
      const iframe = document.querySelector("#mock-youtube-iframe");
      return {
        stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height },
        layout: { width: frame.clientWidth, height: frame.clientHeight },
        iframe: {
          width: parseFloat(getComputedStyle(iframe).width),
          height: parseFloat(getComputedStyle(iframe).height)
        }
      };
    });
    const expectedMiniWidth = Math.min(item.width, 640, item.height * 16 / 9);
    approx(initial.stage.width, expectedMiniWidth, 1,
      item.name + ": normal player should use the centered responsive mini-player size");
    approx(initial.stage.height, expectedMiniWidth * 9 / 16, 1,
      item.name + ": normal player should keep 16:9 ratio");
    approx(initial.stage.x + initial.stage.width / 2, item.width / 2, 1,
      item.name + ": normal player is not horizontally centered");
    approx(initial.stage.y + initial.stage.height / 2, item.height / 2, 1,
      item.name + ": normal player is not vertically centered");
    approx(initial.iframe.width, initial.layout.width, 1,
      item.name + ": initial YouTube iframe width mismatch");
    approx(initial.iframe.height, initial.layout.height, 1,
      item.name + ": initial YouTube iframe height mismatch");

    assert.equal(await page.locator("#fullscreen-button").getAttribute("aria-hidden"), "true",
      item.name + ": controls should begin hidden");
    await page.locator("#tap-shield").click({ position: { x: 20, y: 20 } });
    assert.equal(await page.locator("#fullscreen-button").getAttribute("aria-hidden"), "false",
      item.name + ": touch did not reveal controls");
    await page.waitForTimeout(2600);
    assert.equal(await page.locator("#fullscreen-button").getAttribute("aria-hidden"), "true",
      item.name + ": controls did not auto-hide");
    await page.locator("#tap-shield").click({ position: { x: 20, y: 20 } });
    await page.locator("#fullscreen-button").click();
    await page.waitForFunction(() =>
      document.querySelector("#player-stage").classList.contains("virtual-fullscreen")
    );

    const readFullGeometry = () => page.evaluate(() => {
      const stage = document.querySelector("#player-stage");
      const frame = document.querySelector("#video-frame");
      const iframe = document.querySelector("#mock-youtube-iframe");
      const stageRect = stage.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      return {
        active: stage.classList.contains("virtual-fullscreen"),
        rotated: stage.classList.contains("virtual-rotated"),
        stage: { x: stageRect.x, y: stageRect.y, width: stageRect.width, height: stageRect.height },
        frame: { x: frameRect.x, y: frameRect.y, width: frameRect.width, height: frameRect.height },
        layout: { width: frame.clientWidth, height: frame.clientHeight },
        iframe: {
          width: parseFloat(iframe.style.width),
          height: parseFloat(iframe.style.height)
        }
      };
    });

    const full = await readFullGeometry();
    assert.equal(full.active, true, item.name + ": virtual fullscreen did not activate");
    assert.equal(full.rotated, item.height > item.width, item.name + ": initial rotation state is incorrect");
    assertCoverGeometry({
      frame: full.frame,
      layout: full.layout,
      iframe: full.iframe
    }, item.width, item.height, item.name + " fullscreen");
    await page.screenshot({ path: path.join(artifacts, item.name + ".png") });

    const reversed = { width: item.height, height: item.width };
    await page.setViewportSize(reversed);
    await page.evaluate(() => {
      const notify = window.__telegramEvents.viewportChanged;
      if (typeof notify === "function") notify({ is_state_stable: true });
    });
    await page.waitForFunction(() => {
      const stage = document.querySelector("#player-stage");
      return stage.classList.contains("virtual-rotated") === (innerHeight > innerWidth);
    });
    const turned = await readFullGeometry();
    assert.equal(turned.rotated, reversed.height > reversed.width,
      item.name + ": rotation state did not update after viewport change");
    assertCoverGeometry({
      frame: turned.frame,
      layout: turned.layout,
      iframe: turned.iframe
    }, reversed.width, reversed.height, item.name + " after orientation change");

    await page.setViewportSize({ width: item.width, height: item.height });
    await page.evaluate(() => {
      const notify = window.__telegramEvents.viewportChanged;
      if (typeof notify === "function") notify({ is_state_stable: true });
    });
    await page.waitForFunction(() => {
      const stage = document.querySelector("#player-stage");
      return stage.classList.contains("virtual-rotated") === (innerHeight > innerWidth);
    });
    const restoredOrientation = await readFullGeometry();
    assertCoverGeometry({
      frame: restoredOrientation.frame,
      layout: restoredOrientation.layout,
      iframe: restoredOrientation.iframe
    }, item.width, item.height, item.name + " after returning orientation");

    await page.locator("#fullscreen-button").click();
    const restored = await page.evaluate(() => {
      const r = document.querySelector("#player-stage").getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    approx(restored.x + restored.width / 2, item.width / 2, 1,
      item.name + ": exiting fullscreen did not restore horizontal centering");
    approx(restored.y + restored.height / 2, item.height / 2, 1,
      item.name + ": exiting fullscreen did not restore vertical centering");

    console.log("PASS " + item.name +
      ": mini-player size, Telegram viewport event, physical control clicks, " +
      "virtual rotation, cover-fit, iframe resize and exit restoration");
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
  console.log("PASS: all seven Chromium viewport regression cases.");
}
