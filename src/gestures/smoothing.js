import CONFIG from '../config/index.js'

export class GestureSmoothing {
  constructor() {
    this._history = []
    this._lastStableGesture = null
    this._lastChangeTime = 0
    this._lastExecutionTime = 0
    this._cooldownMs = CONFIG.gesture.cooldownMs
    this._executionCooldownMs = CONFIG.gesture.cooldownMs
    this._confidenceThreshold = CONFIG.gesture.confidenceThreshold
  }

  filter(gesture) {
    if (!gesture || gesture === 'none') {
      this._history = []
      return gesture
    }

    this._history.push(gesture)

    if (this._history.length > 5) {
      this._history.shift()
    }

    const counts = new Map()
    for (const g of this._history) {
      counts.set(g, (counts.get(g) || 0) + 1)
    }

    let maxCount = 0
    let stableGesture = this._history[this._history.length - 1]

    for (const [g, count] of counts) {
      if (count > maxCount) {
        maxCount = count
        stableGesture = g
      }
    }

    const confidence = maxCount / this._history.length

    if (confidence < this._confidenceThreshold) {
      return this._lastStableGesture || 'none'
    }

    const now = Date.now()

    if (stableGesture !== this._lastStableGesture) {
      if (now - this._lastChangeTime < this._cooldownMs) {
        return this._lastStableGesture || 'none'
      }
      this._lastChangeTime = now
      this._lastStableGesture = stableGesture
    }

    return stableGesture
  }

  canExecute() {
    const now = Date.now()
    if (now - this._lastExecutionTime >= this._executionCooldownMs) {
      this._lastExecutionTime = now
      return true
    }
    return false
  }

  reset() {
    this._history = []
    this._lastStableGesture = null
  }
}

