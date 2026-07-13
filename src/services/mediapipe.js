import CONFIG from '../config/index.js'
import { dispatchEvent } from '../utils/helpers.js'

export const MEDIAPIPE_EVENTS = {
  INITIALIZED: 'mediapipe:initialized',
  ERROR: 'mediapipe:error',
  RESULTS: 'mediapipe:results',
  LOADING: 'mediapipe:loading',
}

class MediaPipeService {
  constructor() {
    this.hands = null
    this.initialized = false
    this._lastResult = null
  }

  isAvailable() {
    return typeof Hands !== 'undefined' && typeof Camera !== 'undefined'
  }

  async init() {
    if (this.initialized) return

    if (!this.isAvailable()) {
      const err = new Error('MediaPipe scripts not loaded')
      dispatchEvent(MEDIAPIPE_EVENTS.ERROR, { message: err.message })
      throw err
    }

    dispatchEvent(MEDIAPIPE_EVENTS.LOADING, { message: 'Initializing MediaPipe...' })

    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        },
      })

      this.hands.setOptions({
        maxNumHands: CONFIG.mediapipe.maxNumHands,
        modelComplexity: CONFIG.mediapipe.modelComplexity,
        minDetectionConfidence: CONFIG.mediapipe.minDetectionConfidence,
        minTrackingConfidence: CONFIG.mediapipe.minTrackingConfidence,
      })

      this.hands.onResults((results) => {
        this._lastResult = results
        dispatchEvent(MEDIAPIPE_EVENTS.RESULTS, results)
      })

      this.initialized = true
      dispatchEvent(MEDIAPIPE_EVENTS.INITIALIZED)
    } catch (err) {
      dispatchEvent(MEDIAPIPE_EVENTS.ERROR, { message: err.message })
      throw err
    }
  }

  async processFrame(videoElement) {
    if (!this.hands || !this.initialized) return
    await this.hands.send({ image: videoElement })
  }

  getLastResult() {
    return this._lastResult
  }

  async updateOptions(options) {
    if (!this.hands) return
    this.hands.setOptions(options)
  }

  destroy() {
    this.hands = null
    this.initialized = false
    this._lastResult = null
  }
}

export const mediapipeService = new MediaPipeService()
