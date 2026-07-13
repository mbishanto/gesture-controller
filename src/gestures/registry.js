import { GESTURE, GESTURE_LABELS, GESTURE_EMOJIS } from '../config/gestures.js'
import { DEFAULT_GESTURE_MAP, ACTION_LABELS } from '../config/actions.js'

class GestureRegistry {
  constructor() {
    this._gestures = new Map()
    this._actionMap = new Map()
    this._initDefaults()
  }

  _initDefaults() {
    for (const [key, label] of Object.entries(GESTURE_LABELS)) {
      this.registerGesture(key, label, GESTURE_EMOJIS[key] || '')
    }

    for (const [gesture, action] of Object.entries(DEFAULT_GESTURE_MAP)) {
      this.mapGestureToAction(gesture, action)
    }
  }

  registerGesture(id, label, emoji = '') {
    this._gestures.set(id, { id, label, emoji })
  }

  mapGestureToAction(gestureId, actionId) {
    this._actionMap.set(gestureId, actionId)
  }

  getActionForGesture(gestureId) {
    return this._actionMap.get(gestureId) || null
  }

  getGestureInfo(gestureId) {
    return this._gestures.get(gestureId) || { id: gestureId, label: gestureId, emoji: '' }
  }

  getAllGestures() {
    return Array.from(this._gestures.values())
  }

  getActionMap() {
    return new Map(this._actionMap)
  }

  setActionMap(actionMap) {
    this._actionMap = new Map(Object.entries(actionMap))
  }
}

export const gestureRegistry = new GestureRegistry()
