import { cameraService, CAMERA_EVENTS } from './services/camera.js'
import { mediapipeService, MEDIAPIPE_EVENTS } from './services/mediapipe.js'
import { gestureEngine, GESTURE_ENGINE_EVENTS } from './gestures/engine.js'
import { keyboardService } from './services/keyboard.js'
import { storageService } from './services/storage.js'
import { notificationService } from './services/notification.js'
import { gestureRegistry } from './gestures/registry.js'
import { Dashboard } from './components/Dashboard.js'
import { SettingsPanel } from './components/SettingsPanel.js'
import { FPSCounter } from './utils/fps.js'
import CONFIG from './config/index.js'
import { getElement, isBrowserSupported } from './utils/helpers.js'
import { GESTURE } from './config/gestures.js'
import { ACTION } from './config/actions.js'
import { countFingers, isFist } from './gestures/recognizer.js'

class App {
  constructor() {
    this.running = false
    this.locked = false
    this.mouseMode = false
    this.drawMode = false
    this.fpsCounter = new FPSCounter()
    this.dashboard = null
    this.settings = null
    this.animationId = null
    this._frameSkip = 0
    this._frameInterval = 1
    this._prevX = null
    this._prevY = null
    this._smoothX = 0
    this._smoothY = 0
    this._drawCanvas = null
    this._drawCtx = null
    this._swipePoints = []
    this._lastSwipeTime = 0
    this._lastLockTime = 0
    this._lastClearTime = 0
    this._handHistory = []

    this._init()
  }

  _init() {
    if (!isBrowserSupported()) {
      this._showError(
        'Browser Not Supported',
        'Your browser does not support the required features. Please use a modern browser like Chrome, Edge, or Firefox.'
      )
      return
    }

    this._initDrawCanvas()
    this._initDashboard()
    this._initSettings()
    this._initEventListeners()
    this._loadSettings()

    this._showLoading('Initializing Camera...')

    this._boot()
  }

  async _boot() {
    try {
      const videoEl = getElement('video')
      const canvasEl = getElement('canvas')

      if (!videoEl || !canvasEl) {
        throw new Error('Required DOM elements not found')
      }

      this._resizeCanvas(canvasEl)

      this._showLoading('Starting Camera...')
      await cameraService.init(videoEl)

      this._showLoading('Loading AI Model...')
      await mediapipeService.init()

      this._hideLoading()
      this._start(videoEl, canvasEl)
    } catch (err) {
      this._hideLoading()

      if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        this._showError(
          'Camera Permission Denied',
          'Please allow camera access in your browser settings and refresh the page.'
        )
      } else if (err.message.includes('Camera API')) {
        this._showError(
          'Camera Not Available',
          'No camera detected. Please connect a camera and try again.'
        )
      } else if (err.message.includes('MediaPipe')) {
        this._showError(
          'AI Model Failed to Load',
          'Could not load the hand tracking model. Check your internet connection and try again.'
        )
      } else {
        this._showError(
          'Initialization Failed',
          err.message || 'An unexpected error occurred. Please try again.'
        )
      }

      throw err
    }
  }

  _start(videoEl, canvasEl) {
    this.running = true

    const cameraLoop = async () => {
      if (!this.running) return

      this._frameSkip++

      if (this._frameSkip >= this._frameInterval) {
        this._frameSkip = 0

        try {
          await mediapipeService.processFrame(videoEl)
        } catch {
          // frame drop handled silently
        }
      }

      this.animationId = requestAnimationFrame(cameraLoop)
    }

    document.addEventListener(MEDIAPIPE_EVENTS.RESULTS, (e) => {
      this._onResults(e.detail, canvasEl)
    })

    this.animationId = requestAnimationFrame(cameraLoop)
    this.dashboard.updateCameraStatus('Active')
    this.dashboard.setCameraButtonLabel('Camera Active')

    notificationService.success('Gesture AI is ready!')
  }

  _onResults(results, canvasEl) {
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return

    const fps = this.fpsCounter.tick()
    this.dashboard.updateFps(fps)

    ctx.save()
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)

    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height)
    }

    ctx.drawImage(this._drawCanvas, 0, 0)

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.dashboard.updateHandStatus(results.multiHandLandmarks.length)

      const handednessList = results.handedness
        ? results.handedness.map((h) => h[0]?.displayName || 'Unknown')
        : []

      const detected = gestureEngine.process(
        results.multiHandLandmarks,
        handednessList
      )

      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i]

        if (typeof drawConnectors !== 'undefined') {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: '#00FFAE',
            lineWidth: 3,
          })
        }

        if (typeof drawLandmarks !== 'undefined') {
          drawLandmarks(ctx, landmarks, {
            color: '#00E5FF',
            lineWidth: 2,
          })
        }

        const fingerCount = countFingers(landmarks)

        this._smoothX +=
          (landmarks[8].x * canvasEl.width - this._smoothX) * 0.35
        this._smoothY +=
          (landmarks[8].y * canvasEl.height - this._smoothY) * 0.35

        const indexX = this._smoothX
        const indexY = this._smoothY

        ctx.beginPath()
        ctx.arc(indexX, indexY, 14, 0, Math.PI * 2)
        ctx.fillStyle = '#00ffae'
        ctx.shadowColor = '#00ffae'
        ctx.shadowBlur = 25
        ctx.fill()
        ctx.shadowBlur = 0

        this._handleLockGesture(landmarks)

        if (this.locked) {
          ctx.fillStyle = '#ff4444'
          ctx.font = 'bold 28px Arial'
          ctx.fillText('LOCKED', 20, 60)

          ctx.restore()
          return
        }

        const gesture = gestureEngine.getCurrentGesture()

        if (gesture === GESTURE.DRAW || (fingerCount === 1 && !this.mouseMode)) {
          this._drawLine(indexX, indexY)
        }

        if (fingerCount === 5 && Date.now() - this._lastClearTime > 2000) {
          this._clearDrawCanvas()
          this._lastClearTime = Date.now()
          notificationService.info('Canvas cleared')
        }

        this._detectSwipe(landmarks[0]?.x || 0)

        ctx.fillStyle = '#00ffae'
        ctx.font = 'bold 18px Arial'
        ctx.fillText(`FPS: ${fps}`, 16, 36)
        ctx.fillText(`Fingers: ${fingerCount}`, 16, 66)
      }
    } else {
      this.dashboard.updateHandStatus(0)
      gestureEngine.process([], [])
    }

    ctx.restore()
  }

  _handleLockGesture(landmarks) {
    const now = Date.now()
    const config = CONFIG.gesture

    if (
      isFist(landmarks) &&
      now - this._lastLockTime > config.lockCooldownMs
    ) {
      this.locked = !this.locked
      this._lastLockTime = now

      notificationService.info(this.locked ? '🔒 Locked' : '🔓 Unlocked')

      this.dashboard.updateMode(this.locked ? 'Locked' : 'Active')
      this._resetDraw()
    }
  }

  _detectSwipe(x) {
    const now = Date.now()
    const config = CONFIG.gesture

    this._swipePoints.push({ x, time: now })
    this._swipePoints = this._swipePoints.filter(
      (p) => now - p.time < 300
    )

    if (this._swipePoints.length < 2) return

    const dx =
      this._swipePoints[this._swipePoints.length - 1].x -
      this._swipePoints[0].x

    if (
      Math.abs(dx) > config.swipeThreshold &&
      now - this._lastSwipeTime > config.swipeCooldownMs
    ) {
      this._lastSwipeTime = now

      if (dx > 0) {
        keyboardService.execute(ACTION.PREV_SLIDE)
        notificationService.info('⬅️ Previous Slide')
      } else {
        keyboardService.execute(ACTION.NEXT_SLIDE)
        notificationService.info('➡️ Next Slide')
      }

      this._swipePoints = []
    }
  }

  _drawLine(x, y) {
    if (this._prevX === null || this._prevY === null) {
      this._prevX = x
      this._prevY = y
      return
    }

    this._drawCtx.strokeStyle = '#00ffae'
    this._drawCtx.beginPath()
    this._drawCtx.moveTo(this._prevX, this._prevY)
    this._drawCtx.lineTo(x, y)
    this._drawCtx.stroke()

    this._prevX = x
    this._prevY = y
  }

  _resetDraw() {
    this._prevX = null
    this._prevY = null
  }

  _initDrawCanvas() {
    this._drawCanvas = document.createElement('canvas')
    this._drawCanvas.width = window.innerWidth
    this._drawCanvas.height = window.innerHeight
    this._drawCtx = this._drawCanvas.getContext('2d')
    this._drawCtx.lineCap = 'round'
    this._drawCtx.lineJoin = 'round'
    this._drawCtx.lineWidth = 5
    this._drawCtx.strokeStyle = '#00ffae'
  }

  _clearDrawCanvas() {
    if (this._drawCtx && this._drawCanvas) {
      this._drawCtx.clearRect(
        0,
        0,
        this._drawCanvas.width,
        this._drawCanvas.height
      )
    }
    this._resetDraw()
  }

  _initDashboard() {
    const container = getElement('app')
    if (!container) return

    this.dashboard = new Dashboard()
    this.dashboard.init(container)

    this.dashboard.onSettingsClick(() => {
      this.settings?.toggle()
    })

    this.dashboard.onToggleCamera(() => {
      if (cameraService.running) {
        cameraService.stop()
        this.dashboard.updateCameraStatus('Stopped')
        this.dashboard.setCameraButtonLabel('Start Camera')
        notificationService.info('Camera stopped')
      } else {
        this.dashboard.updateCameraStatus('Starting...')
        this.dashboard.setCameraButtonLabel('Starting...')
        cameraService
          .init(getElement('video'))
          .then(() => {
            this.dashboard.updateCameraStatus('Active')
            this.dashboard.setCameraButtonLabel('Camera Active')
            notificationService.success('Camera started')
          })
          .catch(() => {
            this.dashboard.updateCameraStatus('Error')
            this.dashboard.setCameraButtonLabel('Retry Camera')
          })
      }
    })

    gestureEngine.onAction((actionId, gestureId) => {
      keyboardService.execute(actionId)
      this.dashboard.addHistoryEntry(gestureId, actionId, '')
    })
  }

  _initSettings() {
    this.settings = new SettingsPanel()

    document.addEventListener('settings:changed', (e) => {
      this._applySettings(e.detail)
    })
  }

  _initEventListeners() {
    window.addEventListener('resize', () => {
      const canvasEl = getElement('canvas')
      if (canvasEl) this._resizeCanvas(canvasEl)

      if (this._drawCanvas) {
        this._drawCanvas.width = window.innerWidth
        this._drawCanvas.height = window.innerHeight
      }
    })

    window.addEventListener('beforeunload', () => {
      this._destroy()
    })

    document.addEventListener(CAMERA_EVENTS.ERROR, (e) => {
      this.dashboard?.updateCameraStatus('Error: ' + (e.detail?.message || ''))
      notificationService.error('Camera error: ' + (e.detail?.message || ''))
    })

    document.addEventListener(CAMERA_EVENTS.PERMISSION_DENIED, () => {
      this.dashboard?.updateCameraStatus('Permission Denied')
      notificationService.error('Camera permission denied')
    })

    document.addEventListener(GESTURE_ENGINE_EVENTS.GESTURE_DETECTED, (e) => {
      const { gesture, handedness, confidence } = e.detail
      this.dashboard?.updateGesture(gesture, confidence || 0.85, handedness || '')
    })
  }

  _loadSettings() {
    const settings = storageService.getAll()

    if (settings.mirrorCamera !== undefined) {
      const videoEl = getElement('video')
      if (videoEl) {
        videoEl.style.transform = settings.mirrorCamera
          ? 'scaleX(-1)'
          : 'scaleX(1)'
      }
    }

    if (settings.fpsLimit) {
      this._frameInterval = Math.round(60 / settings.fpsLimit) || 1
    }

    if (settings.confidenceThreshold) {
      mediapipeService.updateOptions({
        minDetectionConfidence: settings.confidenceThreshold,
        minTrackingConfidence: settings.confidenceThreshold,
      })
    }

    if (settings.gestureMappings) {
      gestureRegistry.setActionMap(settings.gestureMappings)
    }

    if (settings.showLandmarks === false) {
      this._hideLandmarks = true
    }

    if (settings.showFps === false) {
      this._hideFps = true
    }
  }

  _applySettings(settings) {
    if (settings.mirrorCamera !== undefined) {
      const videoEl = getElement('video')
      if (videoEl) {
        videoEl.style.transform = settings.mirrorCamera
          ? 'scaleX(-1)'
          : 'scaleX(1)'
      }
    }

    if (settings.fpsLimit) {
      this._frameInterval = Math.round(60 / settings.fpsLimit) || 1
    }

    if (settings.confidenceThreshold) {
      mediapipeService.updateOptions({
        minDetectionConfidence: settings.confidenceThreshold,
        minTrackingConfidence: settings.confidenceThreshold,
      })
    }

    if (settings.gestureMappings) {
      gestureRegistry.setActionMap(settings.gestureMappings)
      notificationService.success('Gesture mappings updated')
    }

    if (settings.showFps !== undefined) {
      this._hideFps = !settings.showFps
    }
  }

  _resizeCanvas(canvasEl) {
    canvasEl.width = window.innerWidth
    canvasEl.height = window.innerHeight
  }

  _showLoading(message) {
    let el = getElement('loading-screen')
    if (!el) {
      el = document.createElement('div')
      el.id = 'loading-screen'
      el.className = 'loading-screen'
      el.innerHTML = `
        <div class="loading-screen__spinner"></div>
        <div class="loading-screen__text" id="loadingText">${message}</div>
        <div class="loading-screen__subtext">Gesture AI Controller v2.0</div>
      `
      document.body.appendChild(el)
    } else {
      const textEl = getElement('loadingText')
      if (textEl) textEl.textContent = message
      el.classList.remove('loading-screen--hidden')
    }
  }

  _hideLoading() {
    const el = getElement('loading-screen')
    if (el) {
      el.classList.add('loading-screen--hidden')
      setTimeout(() => el.remove(), 600)
    }
  }

  _showError(title, message) {
    const existing = document.querySelector('.error-overlay')
    if (existing) existing.remove()

    const el = document.createElement('div')
    el.className = 'error-overlay'
    el.innerHTML = `
      <div class="error-overlay__icon">⚠️</div>
      <div class="error-overlay__title">${title}</div>
      <div class="error-overlay__message">${message}</div>
      <button class="error-overlay__btn" id="errorRetry">Try Again</button>
    `
    document.body.appendChild(el)

    el.querySelector('#errorRetry')?.addEventListener('click', () => {
      el.remove()
      this._boot()
    })
  }

  _destroy() {
    this.running = false

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    cameraService.destroy()
    mediapipeService.destroy()
    this.dashboard?.destroy()
    this.settings?.destroy()
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App()
})
