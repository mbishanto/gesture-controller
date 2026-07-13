import { KEYBOARD_SHORTCUTS } from '../config/actions.js'

class KeyboardService {
  constructor() {
    this._actionMap = new Map()
    this._customHandlers = new Map()
    this._enabled = true
  }

  registerAction(action, keyboardEvent = null) {
    const shortcut = keyboardEvent || KEYBOARD_SHORTCUTS[action]
    if (shortcut) {
      this._actionMap.set(action, shortcut)
    }
  }

  registerCustomAction(actionId, handlerFn) {
    this._customHandlers.set(actionId, handlerFn)
  }

  execute(action) {
    if (!this._enabled) return false

    const customHandler = this._customHandlers.get(action)
    if (customHandler) {
      customHandler()
      return true
    }

    const shortcut = this._actionMap.get(action)
    if (!shortcut) return false

    this._dispatchKeyboardEvent(shortcut)
    return true
  }

  _dispatchKeyboardEvent(shortcut) {
    const eventInit = {
      key: shortcut.key,
      code: shortcut.code,
      keyCode: shortcut.keyCode || shortcut.key?.charCodeAt(0) || 0,
      which: shortcut.keyCode || shortcut.key?.charCodeAt(0) || 0,
      bubbles: true,
      cancelable: true,
      ctrlKey: shortcut.ctrl || false,
      shiftKey: shortcut.shift || false,
      altKey: shortcut.alt || false,
      metaKey: shortcut.meta || false,
    }

    document.dispatchEvent(new KeyboardEvent('keydown', eventInit))
    document.dispatchEvent(new KeyboardEvent('keypress', eventInit))
    document.dispatchEvent(new KeyboardEvent('keyup', eventInit))
  }

  setEnabled(enabled) {
    this._enabled = enabled
  }

  isEnabled() {
    return this._enabled
  }
}

export const keyboardService = new KeyboardService()
