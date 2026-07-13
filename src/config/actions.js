import { GESTURE } from './gestures.js'

export const ACTION = {
  NONE: 'none',
  NEXT_SLIDE: 'next_slide',
  PREV_SLIDE: 'prev_slide',
  PLAY_PAUSE: 'play_pause',
  STOP: 'stop',
  FULLSCREEN: 'fullscreen',
  SCREENSHOT: 'screenshot',
  MOUSE_MODE: 'mouse_mode',
  DRAW_MODE: 'draw_mode',
  CLEAR_CANVAS: 'clear_canvas',
  LOCK: 'lock',
  UNDO: 'undo',
  VOLUME_UP: 'volume_up',
  VOLUME_DOWN: 'volume_down',
  SCROLL_UP: 'scroll_up',
  SCROLL_DOWN: 'scroll_down',
}

export const KEYBOARD_SHORTCUTS = {
  [ACTION.NEXT_SLIDE]: { key: 'ArrowRight', code: 'ArrowRight' },
  [ACTION.PREV_SLIDE]: { key: 'ArrowLeft', code: 'ArrowLeft' },
  [ACTION.PLAY_PAUSE]: { key: ' ', code: 'Space' },
  [ACTION.STOP]: { key: 'Escape', code: 'Escape' },
  [ACTION.FULLSCREEN]: { key: 'f', code: 'KeyF', ctrl: true },
  [ACTION.SCREENSHOT]: { key: 's', code: 'KeyS', ctrl: true, shift: true },
  [ACTION.VOLUME_UP]: { key: 'ArrowUp', code: 'ArrowUp' },
  [ACTION.VOLUME_DOWN]: { key: 'ArrowDown', code: 'ArrowDown' },
  [ACTION.SCROLL_UP]: { key: 'PageUp', code: 'PageUp' },
  [ACTION.SCROLL_DOWN]: { key: 'PageDown', code: 'PageDown' },
}

export const ACTION_LABELS = {
  [ACTION.NONE]: 'No Action',
  [ACTION.NEXT_SLIDE]: 'Next Slide',
  [ACTION.PREV_SLIDE]: 'Previous Slide',
  [ACTION.PLAY_PAUSE]: 'Play / Pause',
  [ACTION.STOP]: 'Stop',
  [ACTION.FULLSCREEN]: 'Fullscreen',
  [ACTION.SCREENSHOT]: 'Screenshot',
  [ACTION.MOUSE_MODE]: 'Mouse Mode',
  [ACTION.DRAW_MODE]: 'Draw Mode',
  [ACTION.CLEAR_CANVAS]: 'Clear Canvas',
  [ACTION.LOCK]: 'Lock',
  [ACTION.UNDO]: 'Undo',
  [ACTION.VOLUME_UP]: 'Volume Up',
  [ACTION.VOLUME_DOWN]: 'Volume Down',
  [ACTION.SCROLL_UP]: 'Scroll Up',
  [ACTION.SCROLL_DOWN]: 'Scroll Down',
}

export const DEFAULT_GESTURE_MAP = {
  [GESTURE.FIST]: ACTION.LOCK,
  [GESTURE.POINTER]: ACTION.MOUSE_MODE,
  [GESTURE.PEACE]: ACTION.NEXT_SLIDE,
  [GESTURE.OPEN_PALM]: ACTION.STOP,
  [GESTURE.THUMBS_UP]: ACTION.PLAY_PAUSE,
  [GESTURE.THUMBS_DOWN]: ACTION.VOLUME_DOWN,
  [GESTURE.OK]: ACTION.CLEAR_CANVAS,
  [GESTURE.LOVE]: ACTION.FULLSCREEN,
  [GESTURE.ROCK]: ACTION.VOLUME_UP,
  [GESTURE.WAVE]: ACTION.SCREENSHOT,
  [GESTURE.DRAW]: ACTION.DRAW_MODE,
  [GESTURE.THREE]: ACTION.UNDO,
  [GESTURE.FOUR]: ACTION.SCREENSHOT,
  [GESTURE.PINCH]: ACTION.SCROLL_DOWN,
}
