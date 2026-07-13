# Contributing

We welcome contributions! Here's how to get started:

## Development Setup

1. Fork and clone the repository
2. Serve the project with any HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in a modern browser
4. Make changes and refresh to see them

## Code Style

- Use ES module syntax (import/export)
- Follow the existing naming conventions
- No build step — write code that runs natively in browsers
- Keep functions small and focused (single responsibility)
- Document complex functions with JSDoc-style comments

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test in Chrome, Firefox, and Edge
4. Update documentation if needed
5. Open a PR with a clear description of changes

## Adding a New Gesture

1. Add the gesture ID to `src/config/gestures.js`
2. Implement the recognition logic in `src/gestures/recognizer.js`
3. Add a default action mapping in `src/config/actions.js`
4. The Settings panel will automatically pick it up

## Adding a New Action

1. Add the action ID and shortcut in `src/config/actions.js`
2. Add default gesture mapping in the same file
3. The system will automatically make it configurable
