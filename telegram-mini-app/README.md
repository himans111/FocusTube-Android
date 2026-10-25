# TubeBridge — Telegram YouTube Mini App

A static, single-page player for Telegram Mini Apps. It accepts common YouTube video links (watch, youtu.be, Shorts, Live, embed) and playlist links. It reads Telegram's Mini App `startapp` parameter to load a video automatically and can create a Telegram deep link for each selected video or playlist.

## Published HTTPS URL

**Preferred URL for Telegram BotFather (short enough for restrictive URL fields):**

`https://himans111.github.io/FocusTube-Android/`

This URL becomes live after enabling GitHub Pages once in the repository settings. The minimal single-player page is already stored at `site/index.html`; set the Pages source to **Deploy from a branch**, branch **main**, folder **/site**, then Save. This uses GitHub Pages' real HTML hosting rather than a URL shortener that may show HTML source in an in-app browser.

The page is only a black 16:9 player box. It reads Telegram's Mini App `startapp` payload, recognizes video IDs, common YouTube URLs, playlists, and nested Telegram links where a `startapp` payload is included, and tries muted inline autoplay.

## Connect to Telegram

1. Open the repository's [GitHub Pages settings](https://github.com/himans111/FocusTube-Android/settings/pages).
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch `main` and folder `/site`, then press **Save**.
4. After GitHub Pages is published, set the `click` Mini App's Web App URL in [@BotFather](https://t.me/BotFather) to:

   `https://himans111.github.io/FocusTube-Android/`

5. Open a test deep link such as `https://t.me/Karanany_bot/click?startapp=v2k16ANGHMQ`.

The player reads the payload from Telegram's Mini App data. For a video, `startapp` should be the 11-character YouTube ID. For a playlist, use `pl_` plus the playlist ID. The player tries muted autoplay; mobile/Telegram settings or YouTube embed restrictions can still require a tap.

## Make channel posts open in the Mini App

A plain YouTube URL does not automatically launch a Telegram Mini App. The message must contain a Telegram Mini App deep link. For example, a YouTube video ID `v2k16ANGHMQ` becomes:

`https://t.me/Karanany_bot/click?startapp=v2k16ANGHMQ`

A posting bot/script can extract IDs from YouTube watch, youtu.be, Shorts, Live, or embed links and add the corresponding Telegram deep link to each post. The player can also parse a full YouTube URL or a nested Telegram link if that value is actually supplied as the Mini App's `startapp` payload.

## Limitations

- This is a static website; it does not read Telegram channel messages or post to channels on its own.
- To make each channel post open this player, the posting script must transform each YouTube URL into a Mini App deep link.
- Some videos cannot be embedded because of owner settings, age/region restrictions, or YouTube policies. An **Open on YouTube** fallback is provided.
- The page accepts common video links and playlists. Channel, search, and clip URLs are not the same as a single video URL and may not be playable by this player.
- Never put a Telegram bot token or other secret in this HTML file or any public client-side code.
