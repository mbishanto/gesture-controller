# GestureAI Controller

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0.0-00ffae)

> AI-powered hand gesture controller for presentations, media, and desktop applications.

Control presentations, videos, and applications using nothing but your hand gestures — no remote, no keyboard, no touch required.

---

## Features

- **10+ Gestures** — Fist, Peace, Thumbs Up/Down, OK, Love, Rock, Wave, Pointer, Open Palm
- **Real-time Control** — Keyboard shortcuts dispatched for slides, playback, volume, and more
- **Dual Hand Support** — Tracks both left and right hands
- **Gesture Smoothing** — Debounce, cooldown, confidence filtering reduce false positives
- **Modern UI** — Glassmorphism dashboard with dark/light mode, gesture history, FPS monitor
- **Configurable** — Every gesture can be mapped to any action via the Settings panel
- **Persistent Settings** — Preferences saved to localStorage
- **Responsive** — Works on desktop and mobile browsers
- **60 FPS** — Optimized rendering pipeline

### Supported Gestures

| Gesture | Emoji | Default Action |
|---------|-------|---------------|
| Fist | ✊ | Lock |
| Pointer | ☝️ | Mouse Mode |
| Peace | ✌️ | Next Slide |
| Open Palm | 🖐️ | Stop |
| Thumbs Up | 👍 | Play / Pause |
| Thumbs Down | 👎 | Volume Down |
| OK | 👌 | Clear Canvas |
| Love | 🤟 | Fullscreen |
| Rock | 🤘 | Volume Up |
| Wave | 👋 | Screenshot |
| Draw | ✍️ | Draw Mode |

### Slideshow Controls

| Gesture | Action |
|---------|--------|
| Swipe Left | Next Slide (→) |
| Swipe Right | Previous Slide (←) |
| Peace Sign | Next Slide |
| Open Palm | Escape (Stop) |

Works with PowerPoint, Google Slides, Canva, PDF readers, and any presentation software that supports keyboard shortcuts.

---

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gesture-controller.git
   cd gesture-controller
   ```

2. **Serve the files**
   ```bash
   # Using Python
   python -m http.server 8080

   # Using Node.js
   npx serve .

   # Using VS Code
   # Install "Live Server" extension → Right-click index.html → Open with Live Server
   ```

3. **Open in browser**
   Navigate to `http://localhost:8080`

4. **Allow camera access**
   Grant camera permission when prompted. Show your hand to the camera.

---

## Project Structure

```
src/
├── index.js               # Application entry point
├── config/
│   ├── index.js           # Default configuration
│   ├── gestures.js        # Gesture definitions & labels
│   └── actions.js         # Action definitions & mappings
├── gestures/
│   ├── engine.js          # Gesture recognition engine
│   ├── recognizer.js      # ML-based gesture matching
│   ├── smoothing.js       # Filtering & cooldown logic
│   └── registry.js        # Gesture-action mapping registry
├── services/
│   ├── camera.js          # Camera initialization & management
│   ├── mediapipe.js       # MediaPipe Hands wrapper
│   ├── keyboard.js        # Keyboard shortcut dispatcher
│   ├── storage.js         # localStorage persistence
│   └── notification.js    # Toast notification system
├── components/
│   ├── Dashboard.js       # Main UI dashboard
│   ├── SettingsPanel.js   # Configuration panel
│   └── Notification.js    # Notification component styles
├── utils/
│   ├── fps.js             # FPS counter
│   └── helpers.js         # Utility functions
└── styles/
    └── main.css           # Global stylesheet
```

---

## Architecture

```
Camera ──► MediaPipe ──► Gesture Engine ──► Action Manager ──► Keyboard
              │               │                    │
              ▼               ▼                    ▼
           Canvas UI      Dashboard UI        Notifications
```

The system follows a clean, layered architecture:

1. **Camera Service** — Captures video stream with error handling
2. **MediaPipe Service** — Wraps the hand tracking model
3. **Gesture Engine** — Recognizes gestures, applies smoothing, manages state
4. **Action Manager** — Maps gestures to configurable actions
5. **Keyboard Service** — Dispatches real keyboard events

---

## Gesture Recognition Algorithm

The recognizer uses MediaPipe's 21 hand landmarks and analyzes:
- Finger extension (tip vs. PIP y-coordinates)
- Thumb abduction (tip vs. IP x-distance)
- Finger spread (distance between extended fingers)
- Hand orientation (wrist-to-finger direction)

Each gesture is validated through a multi-frame smoothing window with configurable confidence thresholds and cooldown periods.

---

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Camera | Camera device selection | Default |
| Mirror Camera | Horizontal flip | Enabled |
| Confidence Threshold | Minimum detection confidence | 0.7 |
| Gesture Sensitivity | Recognition sensitivity | 0.5 |
| Gesture Cooldown | Minimum time between gestures | 300ms |
| FPS Limit | Processing frame rate | 30 |
| Show Landmarks | Display hand skeleton | Enabled |
| Gesture Mappings | Per-gesture action assignment | Default |

All settings persist across sessions via localStorage.

---

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Opera 76+ | ✅ Full |

Requires WebRTC (getUserMedia) and WebGL support.

---

## Development

```bash
# No build step required — just serve the files
# The project uses ES modules with native browser imports
```

To contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## Roadmap

- [ ] WASM-accelerated gesture recognition
- [ ] Desktop companion app (Electron / Tauri)
- [ ] Custom gesture training
- [ ] WebSocket integration for remote control
- [ ] VR/AR hand tracking support
