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
    return typeof Hands !== 'undefined'
  }

  async init(retries = 3) {
    if (this.initialized) return

    for (let attempt = 1; attempt <= retries; attempt++) {
      if (!this.isAvailable()) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt))
          continue
        }
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
        return
      } catch (err) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt))
          continue
        }
        dispatchEvent(MEDIAPIPE_EVENTS.ERROR, { message: err.message })
        throw err
      }
    }
  }

  async processFrame(videoElement) {
    if (!this.hands || !this.initialized) return
    if (!videoElement || videoElement.readyState < 2) return
    try {
      await this.hands.send({ image: videoElement })
    } catch {
      // frame drop handled silently
    }
  }

  getLastResult() {
    return this._lastResult
  }

  async updateOptions(options) {
    if (!this.hands) return
    this.hands.setOptions(options)
  }

  destroy() {
    if (this.hands && typeof this.hands.close === 'function') {
      this.hands.close()
    }
    this.hands = null
    this.initialized = false
    this._lastResult = null
  }
}

export const mediapipeService = new MediaPipeService()
