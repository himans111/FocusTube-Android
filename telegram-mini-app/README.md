# TubeBridge — Telegram YouTube Mini App

A static, single-page player for Telegram Mini Apps. It accepts common YouTube video links (watch, youtu.be, Shorts, Live, embed) and playlist links. It reads Telegram's Mini App `startapp` parameter to load a video automatically and can create a Telegram deep link for each selected video or playlist.

## Published HTTPS URL

Use this verified static page URL as the Mini App's Web App URL:

`https://cdn.jsdelivr.net/gh/himans111/FocusTube-Android@978bca258586667c479fcf88c80676554ba50ee1/telegram-mini-app/index.html`

This page is served from the public GitHub repository through jsDelivr's HTTPS CDN. The source file is `telegram-mini-app/index.html`. This avoids needing to enable GitHub Pages in repository settings.

## Connect to Telegram

1. Open [@BotFather](https://t.me/BotFather).
2. Use `/myapps` and select your existing Mini App, or create one with `/newapp` after selecting your bot.
3. Set the Mini App's Web App URL to the published HTTPS URL above.
4. Open the Mini App and paste a YouTube link to test it.
5. Enter the exact Telegram bot username and Mini App short name shown by BotFather. Select **वीडियो चलाएँ**, then **Mini App लिंक बनाएँ**. The resulting link opens the selected video in this player.

A generated video link has this form:

`https://t.me/<bot_username>/<app_short_name>?startapp=<video_id>`

The bot username and Mini App short name must match BotFather exactly. This repository does not change BotFather settings automatically.

## Make channel posts open in the Mini App

A normal YouTube URL posted to a Telegram channel will not automatically redirect into a Mini App. Your posting code (for example Google Apps Script) must include the generated Telegram deep link in the message. For each video, extract the 11-character video ID and use:

`https://t.me/<bot_username>/<app_short_name>?startapp=<video_id>`

You can include both the original YouTube link and the Mini App link in the post. For playlists, this page uses `pl_` plus the playlist ID as the start parameter.

## Limitations

- This is a static website; it does not read Telegram channel messages or post to channels on its own.
- To make each channel post open this player, the posting script must transform each YouTube URL into a Mini App deep link.
- Some videos cannot be embedded because of owner settings, age/region restrictions, or YouTube policies. An **Open on YouTube** fallback is provided.
- The page accepts common video links and playlists. Channel, search, and clip URLs are not the same as a single video URL and may not be playable by this player.
- Never put a Telegram bot token or other secret in this HTML file or any public client-side code.
