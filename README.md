# Periodic Table Arena — Interactive Drag & Drop Chemistry Lab (PWA + Android APK)

An interactive offline-ready HTML, CSS, and JavaScript application featuring a **blank 118-element Periodic Table** where learners drag & drop elements into their true periodic positions with real-time **Sahi (Correct ✓) / Galat (Wrong ✗)** validation, **72 Hinglish Mnemonics + Custom Editable Mnemonics**, **Exam Sheet Mode**, **Phase Temperature Simulator**, and **Animated Bohr Atomic Shell Models**.

## Key Features

- **Top-Bar App Download (`⬇ App`) — Dual Android `.apk` + Instant Offline PWA**:
  - Compact emerald download button (`#btnInstallApp`) right inside the top bar opens the **Download / Install App** modal with two one-tap options:
    1. **📦 Standalone Offline Android `.apk`** (`download/Periodic-Table-Arena.apk`, ~169 KB) — native Android launcher app (`com.periodictable.arena`, `minSdkVersion 21`, `targetSdkVersion 33`, signed with JAR v1 + APK Signature Scheme v2), runs 100% offline with zero browser bar and persistent `localStorage`.
    2. **⚡ Instant Offline PWA** (`manifest.webmanifest` + `sw.js`) — one-tap native `beforeinstallprompt` WebAPK install on Android Chrome / Edge / Desktop + offline Service Worker pre-caching.
- **Full 118 IUPAC Periodic Table Architecture**: Complete 18-group × 7-period grid plus dedicated **6* Lanthanide (57–71)** and **7* Actinide (89–103)** f-block rows with interactive bridge indicators.
- **Desi Mnemonics Studio (`🧠 Mnemonics`)**:
  - **3 Built-in Hinglish Presets per Group/Series (72 Total)** across s-block, p-block, d-block (`3d`, `4d`, `5d`, `6d`, plus vertical Groups 3–12 including `B-B-A-B`), and f-block (`6*` Lanthanides & `7*` Actinides).
  - **Custom Editable User Mnemonics (`✏️ Edit / Apni Trick Likho`)** saved persistently in `localStorage` with instant active selection on the board banner.
- **3 Interactive Modes**:
  1. **⚡ Live Check Mode (`Sahi / Galat`)**: Instant verification on every drop, combo streak scoring, Web Audio sound effects, and progressive chemistry hints on mistakes.
  2. **📝 Exam Sheet Mode**: Fill blank slots freely across the table, swap placed tiles, and click **Check Sahi / Galat** to grade the entire table at once.
  3. **🔬 Study Reference Mode**: Explore all 118 elements with orbital block filters (`s`, `p`, `d`, `f`), 10 category highlights, a **0 K – 6000 K Phase Simulator**, and **Animated SVG Bohr Electron Shell Diagrams**.
- **Android Phone & Tablet First-Class UX**:
  - Full 2D vertical + horizontal touch scrolling in both normal view and **Phone Fullscreen (`⛶`)** (Portrait & Landscape), smart touch-drag gesture lock, auto board edge-panning, and haptics.

## Project Structure

```text
├── index.html                        # App shell, top-bar ⬇ App button & modals
├── manifest.webmanifest              # WebAPK manifest (192px & 512px maskable/any icons)
├── sw.js                             # Offline-first Service Worker cache
├── css/
│   └── style.css                     # Responsive 18-column grid, themes & mobile fullscreen styles
├── js/
│   ├── elements-data.js              # Verified 118 IUPAC elements dataset & shell configs
│   ├── mnemonics-data.js             # 72 Hinglish mnemonics + custom localStorage studio data
│   ├── sound.js                      # Zero-dependency Web Audio API synthesizer + haptics
│   └── app.js                        # Game engine, Mnemonics Studio, PWA/APK installer & Bohr SVG
├── icons/
│   ├── icon.svg                      # Vector app emblem
│   ├── icon-96.png                   # Native Android launcher icon
│   ├── icon-192.png                  # PWA home-screen icon (192×192)
│   └── icon-512.png                  # PWA splash/launcher icon (512×512)
├── download/
│   └── Periodic-Table-Arena.apk      # Prebuilt v1+v2 signed standalone offline Android APK
└── scripts/
    └── build-apk.py                  # Pure-Python Android APK + DEX + AXML + ARSC + v1/v2 signer
```

## Running Locally & Rebuilding the Android APK

Start a local server on port `8000`:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Rebuild the signed standalone Android `.apk` after UI updates (requires `cryptography`):

```bash
python3 scripts/build-apk.py
```
