# Changelog

## [2.0.0] - 2026-07-13

### Major Changes
- Complete architectural rewrite with modular ES module system
- New gesture recognition engine supporting 10+ gestures
- Gesture smoothing, confidence filtering, and cooldown system
- Configurable gesture-to-action mapping

### Added
- Settings panel with persistent localStorage
- Real keyboard shortcut dispatching (Arrow keys, Space, Escape, etc.)
- Dual hand tracking support (left and right hands)
- Gesture history tracker
- Toast notification system
- Loading screen with initialization states
- Error handling for camera, permissions, and MediaPipe failures
- Comprehensive CSS with glassmorphism, dark/light themes, responsive layout
- Accessibility improvements (ARIA labels, keyboard nav, reduced motion)
- FPS limiter for performance optimization
- Adaptive swipe detection with configurable threshold

### Fixed
- `document.getElementById("status")` null reference bug
- CSS/HTML class mismatches (`.card` vs `.gesture-card`)
- Early return when locked causing frozen UI
- Draw canvas content loss on window resize
- Camera and MediaPipe cleanup on page unload
- Missing mobile responsiveness

### Removed
- Inline CSS (moved to external stylesheet)
- Inline JavaScript (moved to ES modules)
- Hardcoded gesture labels (now data-driven)
- `console.log` slide actions (replaced with real keyboard events)

## [1.0.0] - 2026-01-15

- Initial release with basic finger counting
- MediaPipe hand tracking
- Simple draw, pointer, and swipe gestures
- Basic HUD display
