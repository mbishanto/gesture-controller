import { GESTURE } from '../config/gestures.js'
import { recognizeGesture, isWaveGesture } from './recognizer.js'
import { GestureSmoothing } from './smoothing.js'
import { gestureRegistry } from './registry.js'
import { dispatchEvent } from '../utils/helpers.js'

export const GESTURE_ENGINE_EVENTS = {
  GESTURE_DETECTED: 'gesture:detected',
  GESTURE_CHANGED: 'gesture:changed',
  ACTION_TRIGGERED: 'gesture:action',
  HAND_LOST: 'gesture:hand_lost',
}

class GestureEngine {
  constructor() {
    this._smoothing = new GestureSmoothing()
    this._currentGesture = GESTURE.NONE
    this._prevGesture = GESTURE.NONE
    this._handHistory = new Map()
    this._activeHands = 0
    this._enabled = true
    this._actionCallback = null
  }

  process(landmarksList, handednessList) {
    if (!this._enabled) return

    const detectedGestures = []

    if (landmarksList && landmarksList.length > 0) {
      this._activeHands = landmarksList.length

      for (let i = 0; i < landmarksList.length; i++) {
        const landmarks = landmarksList[i]
        const handedness = handednessList?.[i] || 'Unknown'

        const rawGesture = recognizeGesture(landmarks)
        let smoothGesture = this._smoothing.filter(rawGesture)

        smoothGesture = this._trackHand(i, landmarks, smoothGesture)

        detectedGestures.push({
          gesture: smoothGesture,
          rawGesture,
          handedness,
          landmarks,
          confidence: this._calculateConfidence(landmarks),
        })
      }
    } else {
      this._activeHands = 0
      if (this._currentGesture !== GESTURE.NONE) {
        this._smoothing.reset()
        dispatchEvent(GESTURE_ENGINE_EVENTS.HAND_LOST, {
          prevGesture: this._currentGesture,
        })
      }
      this._prevGesture = this._currentGesture
      this._currentGesture = GESTURE.NONE
      return detectedGestures
    }

    const primaryHand = detectedGestures[0]

    if (primaryHand) {
      this._prevGesture = this._currentGesture
      this._currentGesture = primaryHand.gesture

      if (this._currentGesture !== this._prevGesture && this._currentGesture !== GESTURE.NONE) {
        dispatchEvent(GESTURE_ENGINE_EVENTS.GESTURE_CHANGED, {
          gesture: this._currentGesture,
          previous: this._prevGesture,
          handedness: primaryHand.handedness,
          confidence: primaryHand.confidence,
        })
      }

      if (this._currentGesture !== GESTURE.NONE) {
        dispatchEvent(GESTURE_ENGINE_EVENTS.GESTURE_DETECTED, {
          gesture: this._currentGesture,
          handedness: primaryHand.handedness,
          confidence: primaryHand.confidence,
          landmarks: primaryHand.landmarks,
        })
      }

      if (this._smoothing.canExecute() && this._currentGesture !== GESTURE.NONE) {
        const actionId = gestureRegistry.getActionForGesture(this._currentGesture)
        if (actionId && this._actionCallback) {
          this._actionCallback(actionId, this._currentGesture)
          dispatchEvent(GESTURE_ENGINE_EVENTS.ACTION_TRIGGERED, {
            gesture: this._currentGesture,
            action: actionId,
            handedness: primaryHand.handedness,
          })
        }
      }
    }

    return detectedGestures
  }

  _trackHand(index, landmarks, gesture) {
    const now = Date.now()
    const wristX = landmarks[0]?.x || 0

    if (!this._handHistory.has(index)) {
      this._handHistory.set(index, [])
    }

    const history = this._handHistory.get(index)
    history.push({ wristX, gesture, time: now })

    if (history.length > 30) {
      history.shift()
    }

    if (isWaveGesture(landmarks, history)) {
      return GESTURE.WAVE
    }

    return gesture
  }

  _calculateConfidence(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0

    const visibilities = landmarks
      .filter((l) => l && typeof l.visibility === 'number')
      .map((l) => l.visibility)

    if (visibilities.length === 0) return 0.8

    return visibilities.reduce((a, b) => a + b, 0) / visibilities.length
  }

  getCurrentGesture() {
    return this._currentGesture
  }

  getPreviousGesture() {
    return this._prevGesture
  }

  getActiveHandCount() {
    return this._activeHands
  }

  onAction(callback) {
    this._actionCallback = callback
  }

  setEnabled(enabled) {
    this._enabled = enabled
    if (!enabled) {
      this._smoothing.reset()
    }
  }

  isEnabled() {
    return this._enabled
  }

  reset() {
    this._smoothing.reset()
    this._handHistory.clear()
    this._currentGesture = GESTURE.NONE
    this._prevGesture = GESTURE.NONE
    this._activeHands = 0
  }
}

export const gestureEngine = new GestureEngine()
