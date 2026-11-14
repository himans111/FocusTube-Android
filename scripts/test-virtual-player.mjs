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
    { name: "desktop-1920x1080", width: 1920, height: 1080, mobile: false },
    { name: "macbook-1512x982", width: 1512, height: 982, mobile: false },
    { name: "ultrawide-2560x1080", width: 2560, height: 1080, mobile: false }
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
          viewportStableHeight: window.innerHeight,
          isFullscreen: false,
          ready() { window.__telegramReady = true; },
          expand() { window.__telegramExpanded = true; },
          requestFullscreen() {
            this.isFullscreen = true;
            window.__telegramFullscreenRequests = (window.__telegramFullscreenRequests || 0) + 1;
            if (window.__telegramEvents.fullscreenChanged) window.__telegramEvents.fullscreenChanged();
          },
          exitFullscreen() {
            this.isFullscreen = false;
            if (window.__telegramEvents.fullscreenChanged) window.__telegramEvents.fullscreenChanged();
          },
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
    // The mobile emulation's innerHeight can differ from the CSS visual
    // viewport. Mirror Telegram's CSS-pixel viewport values after the meta
    // viewport has been parsed, before testing the player layout.
    await page.evaluate(() => {
      const visual = window.visualViewport;
      const height = visual && Math.abs((visual.scale || 1) - 1) < 0.02
        ? visual.height : document.documentElement.clientHeight || window.innerHeight;
      const webApp = window.Telegram.WebApp;
      webApp.viewportHeight = height;
      webApp.viewportStableHeight = height;
      const notify = window.__telegramEvents.viewportChanged;
      if (typeof notify === "function") notify({ isStateStable: true });
    });

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
          window.__mockPlayerCalls = [];
          let muted = false;
          const target = {
            getIframe: () => iframe,
            setSize() { window.__mockPlayerCalls.push("setSize"); },
            unMute() { muted = false; window.__mockPlayerCalls.push("unMute"); },
            mute() { muted = true; window.__mockPlayerCalls.push("mute"); },
            isMuted() { return muted; },
            setVolume(value) { window.__mockPlayerCalls.push("setVolume:" + value); },
            playVideo() { window.__mockPlayerCalls.push("playVideo"); }
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
      fullscreenListener: typeof window.__telegramEvents.fullscreenChanged === "function",
      telegramFullscreenRequests: window.__telegramFullscreenRequests || 0,
      telegramIsFullscreen: window.Telegram.WebApp.isFullscreen,
      videoId: window.__mockPlayerConfig && window.__mockPlayerConfig.videoId,
      fullscreenParam: window.__mockPlayerConfig &&
        window.__mockPlayerConfig.playerVars.fs,
      playerCalls: window.__mockPlayerCalls,
      iframeAllow: document.querySelector("#mock-youtube-iframe").allow,
      muteParam: window.__mockPlayerConfig &&
        window.__mockPlayerConfig.playerVars.mute
    }));
    assert.equal(boot.ready, true, item.name + ": Telegram ready() was not called");
    assert.equal(boot.expanded, true, item.name + ": Telegram expand() was not called");
    assert.equal(boot.viewportListener, true, item.name + ": Telegram viewportChanged listener missing");
    assert.equal(boot.fullscreenListener, true, item.name + ": Telegram fullscreenChanged listener missing");
    assert.ok(boot.telegramFullscreenRequests >= 1, item.name + ": Telegram requestFullscreen was not called on launch");
    assert.equal(boot.telegramIsFullscreen, true, item.name + ": Telegram did not enter fullscreen on launch");
    assert.equal(boot.videoId, "dQw4w9WgXcQ", item.name + ": Telegram start_param was not parsed");
    assert.equal(boot.fullscreenParam, 0, item.name + ": expected website-owned fullscreen control");
    assert.ok(boot.playerCalls.includes("unMute"), item.name + ": sound-first autoplay was not attempted");
    assert.ok(boot.playerCalls.includes("playVideo"), item.name + ": autoplay was not attempted");
    assert.ok(boot.iframeAllow.includes("autoplay"), item.name + ": YouTube iframe autoplay permission missing");
    assert.equal(boot.muteParam, undefined, item.name + ": unsupported mute playerVar should not be sent");

    await page.evaluate(() => window.__mockPlayerConfig.events.onAutoplayBlocked());
    assert.equal(await page.evaluate(() => window.__mockPlayer.isMuted()), true,
      item.name + ": blocked autoplay did not switch to muted playback fallback");
    assert.equal(await page.locator("#sound-prompt").isVisible(), true,
      item.name + ": sound fallback control should appear only after autoplay is blocked");
    await page.locator("#sound-prompt").click();
    assert.equal(await page.evaluate(() => window.__mockPlayer.isMuted()), false,
      item.name + ": one user gesture did not enable sound");
    assert.equal(await page.locator("#sound-prompt").isVisible(), false,
      item.name + ": sound prompt did not disappear after user gesture");

    const initial = await page.evaluate(() => {
      const stage = document.querySelector("#player-stage");
      const stageRect = stage.getBoundingClientRect();
      const app = document.querySelector("#app").getBoundingClientRect();
      const frame = document.querySelector("#video-frame");
      const frameRect = frame.getBoundingClientRect();
      const iframe = document.querySelector("#mock-youtube-iframe");
      return {
        active: stage.classList.contains("virtual-fullscreen"),
        viewport: { width: app.width, height: app.height },
        stage: { x: stageRect.x, y: stageRect.y, width: stageRect.width, height: stageRect.height },
        frame: { x: frameRect.x, y: frameRect.y, width: frameRect.width, height: frameRect.height },
        layout: { width: frame.clientWidth, height: frame.clientHeight },
        iframe: { width: parseFloat(iframe.style.width), height: parseFloat(iframe.style.height) }
      };
    });
    assert.equal(initial.active, true,
      item.name + ": video did not enter fullscreen automatically when opened");
    approx(initial.stage.width, initial.viewport.width, 1,
      item.name + ": fullscreen stage width does not match app viewport");
    approx(initial.stage.height, initial.viewport.height, 1,
      item.name + ": fullscreen stage height does not match app viewport");
    assertCoverGeometry({
      frame: initial.frame, layout: initial.layout, iframe: initial.iframe
    }, initial.viewport.width, initial.viewport.height, item.name + " automatic fullscreen");

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
      !document.querySelector("#player-stage").classList.contains("virtual-fullscreen")
    );
    // Exiting virtual fullscreen intentionally leaves the control visible,
    // so the same fullscreen button can immediately re-enter without tapping
    // the now-small mini-player's touch shield.
    await page.locator("#fullscreen-button").click();
    await page.waitForFunction(() =>
      document.querySelector("#player-stage").classList.contains("virtual-fullscreen")
    );

    const waitForIframeToMatchFrame = () => page.waitForFunction(() => {
      const frame = document.querySelector("#video-frame");
      const iframe = document.querySelector("#mock-youtube-iframe");
      if (!frame || !iframe) return false;
      const width = parseFloat(iframe.style.width);
      const height = parseFloat(iframe.style.height);
      return Math.abs(width - frame.clientWidth) <= 1 &&
        Math.abs(height - frame.clientHeight) <= 1;
    }, null, { timeout: 5000 });

    const readFullGeometry = () => page.evaluate(() => {
      const stage = document.querySelector("#player-stage");
      const app = document.querySelector("#app").getBoundingClientRect();
      const frame = document.querySelector("#video-frame");
      const iframe = document.querySelector("#mock-youtube-iframe");
      const stageRect = stage.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      return {
        viewport: { width: app.width, height: app.height },
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

    await waitForIframeToMatchFrame();
    const full = await readFullGeometry();
    assert.equal(full.active, true, item.name + ": virtual fullscreen did not activate");

    // Telegram metrics can differ from the actual browser app box while the
    // bottom sheet is animating. Fixed CSS geometry must stay in the app box.
    const telegramStableHeight = Math.max(240, Math.round(full.viewport.height - 37));
    await page.evaluate(height => {
      const webApp = window.Telegram.WebApp;
      webApp.viewportHeight = height - 9;
      webApp.viewportStableHeight = height;
      window.__telegramEvents.viewportChanged({ isStateStable: true });
    }, telegramStableHeight);
    await page.waitForFunction(() => {
      const app = document.querySelector("#app").getBoundingClientRect();
      const measured = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue("--player-viewport-height"));
      return Math.abs(measured - app.height) <= 1;
    });
    await waitForIframeToMatchFrame();
    const telegramSized = await readFullGeometry();
    assert.equal(telegramSized.rotated, telegramSized.viewport.height > telegramSized.viewport.width,
      item.name + ": Telegram's mismatched report distorted orientation");
    assertCoverGeometry({
      frame: telegramSized.frame,
      layout: telegramSized.layout,
      iframe: telegramSized.iframe
    }, telegramSized.viewport.width, telegramSized.viewport.height,
      item.name + " app box despite Telegram metric difference");

    await page.screenshot({ path: path.join(artifacts, item.name + ".png") });

    const reversed = { width: item.height, height: item.width };
    await page.setViewportSize(reversed);
    await page.evaluate(() => {
      const app = window.Telegram.WebApp;
      const visual = window.visualViewport;
      const height = visual && Math.abs((visual.scale || 1) - 1) < 0.02
        ? visual.height : document.documentElement.clientHeight || window.innerHeight;
      app.viewportHeight = height;
      app.viewportStableHeight = height;
      const notify = window.__telegramEvents.viewportChanged;
      if (typeof notify === "function") notify({ isStateStable: true });
    });
    await page.waitForFunction(() => {
      const stage = document.querySelector("#player-stage");
      const app = document.querySelector("#app").getBoundingClientRect();
      return stage.classList.contains("virtual-rotated") === (app.height > app.width);
    });
    await waitForIframeToMatchFrame();
    const turned = await readFullGeometry();
    assert.equal(turned.rotated, reversed.height > reversed.width,
      item.name + ": rotation state did not update after viewport change");
    assertCoverGeometry({
      frame: turned.frame,
      layout: turned.layout,
      iframe: turned.iframe
    }, turned.viewport.width, turned.viewport.height, item.name + " after orientation change");

    await page.setViewportSize({ width: item.width, height: item.height });
    await page.evaluate(() => {
      const app = window.Telegram.WebApp;
      const visual = window.visualViewport;
      const height = visual && Math.abs((visual.scale || 1) - 1) < 0.02
        ? visual.height : document.documentElement.clientHeight || window.innerHeight;
      app.viewportHeight = height;
      app.viewportStableHeight = height;
      const notify = window.__telegramEvents.viewportChanged;
      if (typeof notify === "function") notify({ isStateStable: true });
    });
    await page.waitForFunction(() => {
      const stage = document.querySelector("#player-stage");
      const app = document.querySelector("#app").getBoundingClientRect();
      return stage.classList.contains("virtual-rotated") === (app.height > app.width);
    });
    await waitForIframeToMatchFrame();
    const restoredOrientation = await readFullGeometry();
    assertCoverGeometry({
      frame: restoredOrientation.frame,
      layout: restoredOrientation.layout,
      iframe: restoredOrientation.iframe
    }, restoredOrientation.viewport.width, restoredOrientation.viewport.height,
      item.name + " after returning orientation");

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
  console.log("PASS: all nine Chromium viewport regression cases.");
}
