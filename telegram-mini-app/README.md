# TubeBridge — Telegram YouTube Mini App

A static, single-page player for Telegram Mini Apps. It accepts common YouTube **video** links (watch, youtu.be, Shorts, Live, embed) and playlist links. It reads a Mini App `startapp` value to load a video automatically, and can build a Telegram deep link for a selected video or playlist.

## Hosting

The repository contains a GitHub Actions workflow at `.github/workflows/deploy-telegram-mini-app.yml`. After that workflow succeeds, the expected GitHub Pages base URL is:

`https://himans111.github.io/FocusTube-Android/`

Check the workflow run and open the Pages URL to confirm it is live before adding it to Telegram.

## Connect to Telegram

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Open **My Apps** (or use `/myapps`) and select your existing Mini App, or create one with `/newapp` after selecting your bot.
3. Set the Mini App's **Web App URL** to the confirmed GitHub Pages URL above. The URL must be HTTPS.
4. Open the published page in Telegram and test a video URL.
5. On the page, enter your exact bot username and the Mini App short name shown in BotFather. Paste a YouTube link, choose **वीडियो चलाएँ**, then choose **Mini App लिंक बनाएँ**. The resulting link will reopen the player with that video.

The generated link looks like:

`https://t.me/<bot_username>/<app_short_name>?startapp=<video_id>`

The bot username and Mini App short name must match BotFather exactly. This repository does not alter BotFather settings automatically.

## Make posts open in this Mini App

A normal YouTube URL posted to a Telegram channel does **not** automatically redirect into a Mini App. Your posting script (for example Google Apps Script) must include the generated Telegram Mini App deep link in the message. For each video, extract the 11-character video ID and build:

`https://t.me/<bot_username>/<app_short_name>?startapp=<video_id>`

You may include both the original YouTube URL and the Mini App link in the Telegram post. For playlist links, the page uses a `pl_` prefix before the playlist ID.

## Limitations

- This is a static website; it does not read Telegram channel messages or post to channels by itself.
- A YouTube link must be converted into a Mini App deep link by the posting script if channel posts should open this player directly.
- Some YouTube videos cannot be embedded due to the video's owner settings, age/region restrictions, or YouTube policies. The player includes an **Open on YouTube** fallback.
- A Mini App deep link passes a compact start parameter (usually the video ID), not a full URL. The page also supports manually pasting a URL after it is opened.
- Never place your Telegram bot token in this HTML, GitHub repository, or any public client-side code.
