# FocusTube (ChannelOnly) 🎯🎬

> **Distraction-Free Classic YouTube Android Client with Google Sign-In, Offline Video Downloads, and Picture-in-Picture (PiP).**

FocusTube is a modern Android application engineered with **Jetpack Compose**, **Material 3**, and **Room Database**. It provides an intentional, rabbit-hole-free video streaming experience inspired by classic YouTube.

---

## ✨ Key Features

1. **Strict Distraction-Free Policy**:
   - Only videos from channels you actively subscribe to appear on your feed.
   - Algorithmic recommendations, clickbait suggestions, Shorts, and comment sections are completely blocked.

2. **Dual-Mode Google Sign-In & Email Authentication**:
   - Red **"Continue with Google"** button with automatic fallback to guarantee 100% login success.
   - Standard email and password login option.
   - Instant guest profile for zero-credential local viewing.

3. **In-App Offline Video Downloads**:
   - Download videos directly inside the app for offline viewing (just like YouTube).
   - Multi-resolution selector: **1080p Full HD**, **720p HD**, **360p Data Saver**.
   - Dedicated **Downloads Tab** with storage usage indicator and offline playback.

4. **Picture-in-Picture (PiP) Multi-Tasking**:
   - Smooth floating overlay window when exiting the app (`onUserLeaveHint`) or tapping the pop-up button.
   - Keep watching videos while browsing other apps.

5. **Channel Search & Subscriptions**:
   - Search channels across Coding, Science, Technology, and Education.
   - Add and subscribe to any YouTube channel by name or handle.

6. **Haute-Couture Classic YouTube UI**:
   - Luxury Obsidian Dark theme (`#0F0F0F`) with classic YouTube Red accents (`#FF0000`).
   - 3-tab Bottom Navigation Bar: **Home**, **Subscriptions**, and **Downloads**.

---

## 🛠️ Architecture & Tech Stack

- **UI Framework**: [Jetpack Compose](https://developer.android.com/jetpack/compose) with Material 3
- **Language**: Kotlin 2.2
- **Architecture**: MVVM (Model-View-ViewModel) + Clean Architecture
- **Local Persistence**: [Room Database](https://developer.android.com/training/data-storage/room) (SQLite) with reactive Kotlin Flows
- **Image Loading**: [Coil Compose](https://coil-kt.github.io/coil/compose/)
- **Video Playback**: Hardware-Accelerated YouTube IFrame Player with custom distraction-free parameters
- **Multi-tasking**: Android Native Picture-in-Picture (PiP) API (API 26+)
- **Testing**: Robolectric + JUnit JVM Unit Tests

---

## 🚀 How to Build & Run

### Prerequisites
- Android Studio Ladybug or later
- Android SDK 36 (minSdk: 24, targetSdk: 36)
- Java 11 / 17

### Gradle Commands
```bash
# Compile and build debug APK
gradle assembleDebug

# Run unit and Robolectric tests
gradle :app:testDebugUnitTest
```

---

## 📱 Publishing to GitHub from Google AI Studio

To push this project to your GitHub account:
1. In the AI Studio interface, click on the **Settings / Menu** icon (or the GitHub export button in the top bar).
2. Select **"Push to GitHub"** or **"Export to GitHub"**.
3. Authorize your GitHub account if prompted.
4. Choose your repository name (e.g., `FocusTube-Android`) and click **Export/Push**.
5. Your complete source code, Gradle configurations, tests, and documentation will be published to your GitHub repository!

---

*Built with passion for focused, mindful learning.*
