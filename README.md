# 💰 WhatsApp Group Payment Tracker

A simple, transparent web app to track monthly financial contributions within a WhatsApp group. Members can view payment statuses without logging in, while an admin manages members and marks payments via a PIN-protected panel.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run Locally (No Firebase)](#run-locally-no-firebase)
  - [Run with Firebase (Cloud Sync)](#run-with-firebase-cloud-sync)
- [Deployment](#deployment)
  - [GitHub Pages](#github-pages)
  - [Netlify](#netlify)
  - [Vercel](#vercel)
- [Usage Guide](#usage-guide)
  - [First-Time Setup](#first-time-setup)
  - [Admin Operations](#admin-operations)
  - [Member View](#member-view)
- [Firebase Setup Guide](#firebase-setup-guide)
- [Configuration](#configuration)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Many WhatsApp groups collect monthly contributions (subscriptions, event funds, etc.) and struggle to track who has paid. Spreadsheets are confusing for non-technical members. This app provides a **visual, tick-based interface** that anyone can understand — no login required for members to *view* the status.

**Key Principle:** Total transparency for members, secure admin control.

---

## Features

| Feature | Description |
|---|---|
| ✅ **Tick-Based Payment Tracking** | Visual tick/cross per member per month |
| 📅 **Month Navigation** | Browse payment history across any month |
| 🔒 **PIN-Protected Admin** | Only admins can mark payments and manage members |
| 👥 **Member Management** | Add/remove members with optional phone numbers |
| 📊 **Live Stats Dashboard** | Total members, paid count, pending, and amount collected |
| 📜 **Activity Log** | Every action is logged with timestamps and filters |
| 📤 **Export/Import Data** | Download data as JSON; import from a backup file |
| 🔥 **Firebase Real-Time Sync** | Optional cloud sync — data updates across all devices instantly |
| 💾 **localStorage Fallback** | Works fully offline without Firebase (data stays on one device) |
| 📱 **Fully Responsive** | Works on mobile, tablet, and desktop |
| 🎨 **Modern Dark UI** | Premium glassmorphism design with smooth animations |

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Page structure and semantic markup |
| **CSS3** | Styling — custom properties, glassmorphism, animations, responsive grid |
| **Vanilla JavaScript** | All app logic, state management, DOM rendering |
| **Firebase Firestore** | *(Optional)* Cloud database for real-time multi-device sync |
| **Google Fonts (Inter)** | Typography |

> **No build tools required.** No Node.js, no npm, no bundler — just open the HTML file.

---

## Project Structure

```
whatsapptickapp/
├── index.html                    # Main HTML page (single-page app)
├── styles.css                    # All CSS styles (dark theme, responsive)
├── app.js                        # Application logic (state, Firebase, rendering)
├── firebase-config.example.js    # 🔑 Firebase config TEMPLATE (committed)
├── firebase-config.js            # 🔒 Your actual Firebase keys (GITIGNORED)
├── README.md                     # This file
├── LICENSE                       # MIT License
├── .gitignore                    # Git ignore rules
└── files/
    └── changes.md                # Internal project notes
```

> ⚠️ **`firebase-config.js` is gitignored** — your API keys will never be pushed to GitHub.

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- *(Optional)* A local development server for best results
- *(Optional)* A Firebase account for cloud sync

### Run Locally (No Firebase)

The app works out of the box using `localStorage` — no server or database required.

**Option 1 — Just open the file:**
```bash
# Clone the repository
git clone https://github.com/<your-username>/whatsapptickapp.git
cd whatsapptickapp

# Open in browser
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

**Option 2 — Use a local dev server (recommended):**

Using Python:
```bash
# Python 3
python3 -m http.server 8080

# Then open http://localhost:8080
```

Using Node.js:
```bash
# Install a simple server globally (one-time)
npm install -g serve

# Serve the project
serve .

# Then open the URL shown in terminal
```

Using VS Code:
```
Install the "Live Server" extension → Right-click index.html → "Open with Live Server"
```

> ⚠️ **Note:** Without Firebase, all data is stored in your browser's `localStorage`. Data will **not** sync across devices or browsers.

### Run with Firebase (Cloud Sync)

To enable real-time data sync across all devices:

1. Create a Firebase project (see [Firebase Setup Guide](#firebase-setup-guide) below)
2. Copy the config template:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```
3. Open `firebase-config.js` and replace the placeholder values with your real Firebase keys:
   ```javascript
   window.FIREBASE_CONFIG = {
       apiKey: "AIzaSyB...",
       authDomain: "my-project.firebaseapp.com",
       projectId: "my-project",
       storageBucket: "my-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
   };
   ```
4. Deploy or run locally — the app will automatically detect Firebase and enable cloud sync.

> 🔒 **Security:** `firebase-config.js` is in `.gitignore` — your API keys will **never** be committed to GitHub. Only the template file (`firebase-config.example.js`) is tracked.

---

## Deployment

Since this is a static site (HTML + CSS + JS only), you can deploy it on **any static hosting platform for free**.

### GitHub Pages

1. Push the code to a GitHub repository
2. Go to **Settings → Pages**
3. Under "Source", select the branch (e.g., `main`) and root folder (`/`)
4. Click **Save**
5. Your app will be live at `https://<your-username>.github.io/whatsapptickapp/`

### Netlify

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click **"Add new site" → "Import an existing project"**
3. Select your GitHub repository
4. Leave build settings empty (no build command needed)
5. Click **Deploy**
6. Your app will be live with a Netlify URL (you can add a custom domain)

### Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"** and import your repository
3. Framework Preset: **Other**
4. Leave build settings empty
5. Click **Deploy**

---

## Usage Guide

### First-Time Setup

1. **Open the app** in your browser
2. Click the **"Admin"** button in the top-right corner
3. You'll be prompted to **create a PIN** (4–6 digits) — this protects admin access
4. Once the PIN is set, the **Admin Panel** sidebar opens
5. Set your **Group Name** and **Monthly Amount (₹)**
6. **Add members** by entering their name and optional phone number

### Admin Operations

| Action | How |
|---|---|
| **Login as Admin** | Click "Admin" → Enter your PIN |
| **Mark payment** | Click the circle (○) next to a member → Enter amount → Confirmed with ✓ |
| **Unmark payment** | Click the green tick (✓) next to a paid member |
| **Add member** | Admin Panel → Enter name + phone → Click "Add Member" |
| **Remove member** | Admin Panel → Click the ✕ button next to a member |
| **Change group settings** | Admin Panel → Update name/amount → "Save Settings" |
| **Export data** | Click "Export" button → Downloads a `.json` backup |
| **Import data** | Admin Panel → "Import Data (JSON)" → Select a backup file |
| **Change PIN** | Admin Panel → Enter current PIN + new PIN → "Change PIN" |
| **Reset all data** | Admin Panel → "Reset All Data" (requires double confirmation) |
| **Logout** | Click "Logout" button (replaces "Admin" when logged in) |

### Member View

- Members can **view** the app without any login or password
- The payment grid shows who has paid (✓ green) and who hasn't (○ pending)
- Members can browse different months using the **← →** navigation arrows
- The stats bar shows total members, paid/pending counts, and total collected
- Members **cannot** modify any data — only the admin can

---

## Firebase Setup Guide

Follow these steps to set up Firebase Firestore for cloud sync:

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter a project name (e.g., `whatsapp-payment-tracker`)
4. Disable Google Analytics (optional, not needed)
5. Click **Create Project**

### Step 2: Enable Firestore Database

1. In your Firebase project, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **Start in test mode** (for quick setup)
4. Select a region closest to your users
5. Click **Enable**

> ⚠️ **Important:** Test mode allows open read/write access for 30 days. For production, update the security rules (see below).

### Step 3: Get Your Firebase Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **"Your apps"** → Click the **Web** icon (`</>`)
3. Register the app with a nickname
4. Copy the `firebaseConfig` object values
5. Run `cp firebase-config.example.js firebase-config.js`
6. Paste your values into `firebase-config.js`

> 🔒 **Never edit `app.js` with your keys** — always use `firebase-config.js` which is gitignored.

### Step 4: Firestore Security Rules (Production)

Go to **Firestore → Rules** and replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appData/{document=**} {
      allow read, write: if true;
    }
  }
}
```

> 💡 This allows open access. Since admin operations are protected by a PIN on the client side, this is acceptable for a small group use case. For tighter security, you can add Firebase Authentication.

---

## Configuration

### Secrets Management

| File | Tracked in Git? | Purpose |
|---|---|---|
| `firebase-config.example.js` | ✅ Yes | Template with placeholder keys — shows the expected format |
| `firebase-config.js` | ❌ No (gitignored) | Your actual Firebase API keys — **never committed** |

### App Settings

| Config | Location | Default | Description |
|---|---|---|---|
| `FIREBASE_CONFIG` | `firebase-config.js` | Placeholder values | Firebase project credentials |
| `groupName` | Set via Admin Panel | `"WhatsApp Group"` | Display name of the group |
| `monthlyAmount` | Set via Admin Panel | `500` | Default monthly contribution (₹) |
| Admin PIN | Set on first access | None (created on first use) | 4–6 digit PIN for admin access |

### localStorage Keys

The app uses these `localStorage` keys (prefixed with `wt_`):

| Key | Purpose |
|---|---|
| `wt_members` | Array of member objects |
| `wt_payments` | Payment records by month |
| `wt_settings` | Group name and monthly amount |
| `wt_admin_pin` | Hashed admin PIN |
| `wt_activity_log` | Activity log entries |

---

## Screenshots

*After deploying, add screenshots here:*

```
![Dashboard](screenshots/dashboard.png)
![Admin Panel](screenshots/admin-panel.png)
![Mobile View](screenshots/mobile-view.png)
```

---

## Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m "Add: my new feature"
   ```
4. **Push** to the branch:
   ```bash
   git push origin feature/my-new-feature
   ```
5. **Open** a Pull Request

### Development Notes

- No build step required — edit HTML/CSS/JS directly
- Test on mobile viewports (the app is responsive)
- The app uses the **Inter** font from Google Fonts (loaded via CDN)
- Firebase SDK is loaded via CDN (no npm install needed)

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for the real-time database
- [Google Fonts](https://fonts.google.com/) for the Inter typeface
- Inspired by the need for simple, transparent group payment tracking

---

<p align="center">
  Made with ❤️ for WhatsApp group admins everywhere
</p>
