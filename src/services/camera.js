import CONFIG from '../config/index.js'
import { dispatchEvent } from '../utils/helpers.js'

export const CAMERA_EVENTS = {
  STARTED: 'camera:started',
  STOPPED: 'camera:stopped',
  ERROR: 'camera:error',
  PERMISSION_DENIED: 'camera:permission_denied',
}

class CameraService {
  constructor() {
    this.stream = null
    this.videoElement = null
    this.running = false
    this._cleanupFns = []
  }

  async init(videoElement, retries = 2) {
    this.videoElement = videoElement

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('Camera API not supported in this browser')
      dispatchEvent(CAMERA_EVENTS.ERROR, { message: err.message })
      throw err
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const constraints = {
          video: {
            width: { ideal: CONFIG.camera.width },
            height: { ideal: CONFIG.camera.height },
            facingMode: CONFIG.camera.facingMode,
            frameRate: { ideal: CONFIG.camera.fps },
          },
          audio: false,
        }

        this.stream = await navigator.mediaDevices.getUserMedia(constraints)

        videoElement.srcObject = this.stream
        await videoElement.play()

        this.running = true
        dispatchEvent(CAMERA_EVENTS.STARTED, { stream: this.stream })

        return this.stream
      } catch (err) {
        this.running = false

        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          dispatchEvent(CAMERA_EVENTS.PERMISSION_DENIED, { message: 'Camera permission denied' })
          throw err
        }

        if (err.name === 'NotReadableError' && attempt < retries) {
          await new Promise((r) => setTimeout(r, 500))
          continue
        }

        if (err.name === 'NotReadableError') {
          dispatchEvent(CAMERA_EVENTS.ERROR, { message: 'Camera is being used by another application' })
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          dispatchEvent(CAMERA_EVENTS.ERROR, { message: 'No camera found' })
        } else {
          dispatchEvent(CAMERA_EVENTS.ERROR, { message: err.message })
        }

        throw err
      }
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    this.running = false
    dispatchEvent(CAMERA_EVENTS.STOPPED)
  }

  async restart(videoElement) {
    this.stop()
    await this.init(videoElement)
  }

  destroy() {
    this.stop()
    this._cleanupFns.forEach((fn) => fn())
    this._cleanupFns = []
  }
}

export const cameraService = new CameraService()
