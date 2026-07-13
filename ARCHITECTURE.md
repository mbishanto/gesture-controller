# Architecture

## Overview

GestureAI Controller follows a clean, layered architecture with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│                      (Entry)                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                     src/index.js                        │
│                    (App Orchestrator)                    │
├───────────┬──────────┬──────────┬──────────┬───────────┤
│           │          │          │          │           │
│   Config  │ Services │ Gestures │Components│   Utils   │
│           │          │          │          │           │
│ gestures/ │ camera/  │ engine/  │Dashboard │ fps.js    │
│ actions/  │ mediapipe│ recogniz │Settings  │ helpers   │
│ index.js  │ keyboard │ smooth   │Notificat │           │
│           │ storage  │ registry │          │           │
│           │ notifica │          │          │           │
└───────────┴──────────┴──────────┴──────────┴───────────┘
```

## Data Flow

1. **Camera** captures video frames
2. **MediaPipe** processes frames and returns hand landmarks
3. **Gesture Engine** analyzes landmarks and identifies gestures
4. **Action Manager** resolves gesture → action mappings
5. **Keyboard Service** dispatches keyboard events
6. **Dashboard UI** updates in real-time

## Key Design Decisions

### ES Modules without Build Step
The project uses native ES modules (`type="module"`) with no bundler. This keeps the setup simple — just serve the directory with any HTTP server.

### Event-Driven Communication
Components communicate through CustomEvents on `document`. This decouples the gesture engine from the UI:

- `mediapipe:results` — New hand tracking data
- `gesture:detected` — Gesture identified
- `gesture:action` — Action triggered
- `settings:changed` — Configuration updated
- `camera:error` — Camera failure

### Gesture Smoothing Pipeline
```
Raw landmarks → Finger states → Gesture guess → Multi-frame buffer
→ Majority vote → Cooldown check → Stable gesture → Action lookup
```

### Separation of Concerns
- **Recognizer** — Pure functions: landmarks → gesture ID
- **Smoothing** — State machine: reduces false positives
- **Engine** — Orchestrator: coordinates recognition + smoothing + action dispatch
- **Registry** — Mapping table: gesture → action (configurable)
