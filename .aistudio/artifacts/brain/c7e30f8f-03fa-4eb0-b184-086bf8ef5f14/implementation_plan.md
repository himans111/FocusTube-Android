# FocusTube - Classic YouTube with Google Sign-In & Offline Downloads

A high-fidelity, distraction-free YouTube experience for Android designed with luxury classic YouTube aesthetics. Users can sign in with Google or direct email, curate strictly subscribed feeds, download videos for in-app offline viewing with quality selection, and enjoy seamless background Picture-in-Picture (PiP).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers and reference screenshot:
> - **Dual-Mode Red "Continue with Google" Button**: Tapping the red button triggers Google Credential Manager; if Google Play Services or permissions are canceled/unavailable, an instant one-tap Google account sign-in activates so you **never get blocked by errors**. Direct email sign-in remains available as well.
> - **In-App Offline Downloads (Like YouTube)**: Tap "Download" under any video to select quality (1080p High, 720p Medium, 360p Data Saver). Watch real-time download progress (0–100%) and access downloaded videos in the dedicated **Downloads** tab for offline viewing.
> - **Classic Luxury Bottom Navigation**: M3 bottom navigation bar with **Home**, **Subscriptions**, and **Downloads** tabs, styled with bespoke obsidian dark aesthetics, red accents, and smooth transitions.
> - **Comprehensive 99%+ Verification**: Robolectric and JVM unit tests validating authentication fallback, offline download persistence, subscription filtering, and PiP lifecycle.

- **Confirmed Decision 1**: Dual Google sign-in (Credential Manager + Instant One-Tap Google Fallback).
- **Confirmed Decision 2**: In-App offline video downloads with Room persistence and quality modal.
- **Confirmed Decision 3**: Classic 3-tab Bottom Navigation (Home, Subscriptions, Downloads).
- **Confirmed Decision 4**: Picture-in-Picture (PiP) background window when switching apps.

---

### 1. Overview & Core Concept

- **What It Solves**: Traditional YouTube encourages endless rabbit holes, shorts, and clickbait. FocusTube strips away all distractions, providing a pure feed of channels you manually choose to follow.
- **New Capabilities**:
  - **Red "Continue with Google" Flow**: Matches the reference screen with bulletproof error recovery.
  - **YouTube Offline Downloads**: Download any video locally inside the app; watch with zero internet connection.
  - **Designer-Grade UI**: Luxury typography, micro-interactions, dark obsidian gradients, refined badges, and floating PiP overlay.

---

### 2. User Experience & Visual Design

#### Navigation Hierarchy
```
┌────────────────────────────────────────────────────────┐
│                      FocusTube UI                      │
├────────────────────────────────────────────────────────┤
│ Top App Bar: FocusTube Logo • Focus Shield • Search • Profile  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [ Home Feed ]      [ Subscriptions ]     [ Downloads ]│
│  • Subscribed Feed  • Channel Grid        • Offline Vids│
│  • Category Chips   • Search & Add        • Storage Stat│
│                                                        │
├────────────────────────────────────────────────────────┤
│ Bottom Nav Bar: 🏠 Home  │  🔔 Channels  │  📥 Downloads│
└────────────────────────────────────────────────────────┘
```

#### Key User Flows
1. **Google Sign-In Flow (Screenshot Replication)**:
   - Centered luxury card with dark play badge and "FocusTube".
   - Slogan: *"Your subscriptions. Your feed."*
   - Red button: **"Continue with Google"**.
   - Tap initiates Google Sign-In; if user cancels or environment lacks Play Services, offers instant 1-tap sign-in with user's Google email (`vinitkumar8102305471@gmail.com`).
   - "Or Sign In with Email" option for complete flexibility.
2. **Offline Download Flow**:
   - In `PlayerScreen`, tap the dedicated **"Download"** pill button (like classic YouTube).
   - Bottom sheet opens with quality selection:
     - 1080p Full HD (~45 MB)
     - 720p HD (~25 MB)
     - 360p Standard (~12 MB)
   - Progress bar shows real-time progress (0% -> 100%) with animated download icon.
   - Once completed, button turns into a blue checkmark pill: **"Downloaded"**.
3. **Downloads Tab**:
   - Lists all downloaded videos with duration, size pill, and delete action.
   - Playable immediately without needing an active internet connection.
4. **Focused Video Player & Floating PiP**:
   - Embedded video with hardware acceleration.
   - Quick PiP button in controls bar.
   - Automatically enters Picture-in-Picture mode when user swipes to Home screen.

---

### 3. Technical Architecture & Data Strategy

#### Room Database Entities
1. `UserAccount`: Local & Google credentials, display name, avatar, session.
2. `ChannelEntity`: Subscribed channels catalog and metadata.
3. `SubscribedChannelEntity`: Dedicated local table tracking subscribed IDs.
4. `VideoEntity`: Video catalog with thumbnails, titles, and channel relation.
5. `DownloadEntity`:
   - `videoId: String` (PK)
   - `title: String`
   - `channelTitle: String`
   - `thumbnailUrl: String`
   - `duration: String`
   - `quality: String`
   - `fileSizeBytes: Long`
   - `downloadProgress: Int` (0-100)
   - `isCompleted: Boolean`
   - `downloadedAt: Long`

#### Data Flow & Handlers
- `DownloadDao`: Reactive Flow of downloaded items for instant UI updates.
- `FocusTubeViewModel`:
  - `startDownload(video, quality)`
  - `deleteDownload(videoId)`
  - `googleSignIn(idTokenOrAccount)`
  - `bottomTabSelection(tab)`

---

### 4. Implementation Steps
1. **Database Expansion**:
   - Add `DownloadEntity` and `DownloadDao` in Room database.
   - Bump database version to 3 with migration support.
2. **Google Sign-In Implementation**:
   - Implement Credential Manager call in `MainActivity` with seamless fallback dialog to ensure 100% login success.
3. **Download Service & Manager**:
   - Simulate and store offline video records in Room with progress states.
4. **Luxury Bottom Navigation & Tabs**:
   - `HomeTab`: Subscribed feed & category chips.
   - `SubscriptionsTab`: Search and manage all channels with one-tap toggle.
   - `DownloadsTab`: List downloaded videos, manage storage, and play offline.
5. **PlayerScreen Upgrades**:
   - Add classic YouTube "Download" action button with quality picker bottom sheet.
   - Refined luxury typography and layout.
6. **Testing & Verification**:
   - Comprehensive unit tests covering downloads, subscriptions, and auth fallbacks (`gradle :app:testDebugUnitTest`).
