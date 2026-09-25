# Interview Coach as a phone / desktop app (PWA)

You host the files once (free, on GitHub Pages). Then you install the app from your phone's browser.

## 1. Put it online (one time, ~5 minutes)
1. Sign in to github.com (your account: rajamani192000) and click **New repository**.
   Name it `interview-coach`, set it to **Public**, and click **Create**.
2. Click **uploading an existing file**. Drag in **all files in this folder**
   (index.html, sw.js, manifest.webmanifest and the icons), then click **Commit changes**.
3. Go to **Settings → Pages**. Under *Branch*, choose `main` and `/ (root)`, then click **Save**.
4. Wait 1–2 minutes. Your app link is
   **https://rajamani192000.github.io/interview-coach/**

## 2. Install it
- **Android (Chrome):** open the link, then tap ⋮ → **Install app**. You can also use Settings → Install app inside the app.
- **iPhone / iPad (Safari):** open the link, then tap Share → **Add to Home Screen**.
  Notifications need iOS 16.4 or later, and you must open the app from the home-screen icon.
- **Desktop (Chrome / Edge):** click the install icon at the right of the address bar.

## 3. First run
- Go to **Settings → Reminders**:
  - tap **Allow browser notifications**
  - tap **Add to Google Calendar** (or download the .ics file)
- Your data stays on the device. To move your progress from the claude.ai version:
  1. There, go to Settings → Backup & data → **Download backup**.
  2. Here, go to Settings → Backup & data → **Restore**.

## Updating
When you get a new `index.html`, upload it to the repository again. It replaces the old file.
The app picks up the new version the next time you open it while online.

## What works where
| | claude.ai version | Installed app |
|---|---|---|
| Home-screen icon, full screen, works offline | – | ✓ |
| Microphone speech-to-text (Chrome / Edge / Android) | blocked | ✓ |
| Claude feedback, Claude resume questions, account sync | ✓ | offline rules only |
| Background daily nudge | – | best effort (Chrome on Android, installed app) |
