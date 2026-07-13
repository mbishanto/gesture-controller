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
    this._hideLandmarks = false
    this._hideFps = false
    this._cleanupFns = []
    this._mediapipeCleanup = null
    this._videoEl = null
    this._canvasEl = null
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

      this._videoEl = videoEl
      this._canvasEl = canvasEl

      this._resizeCanvas(canvasEl)

      this._showLoading('Starting Camera...')
      await cameraService.init(videoEl)

      this._showLoading('Loading AI Model...')
      await mediapipeService.init()

      this._hideLoading()

      if (this._mediapipeCleanup) this._mediapipeCleanup()
      this._mediapipeCleanup = this._addMediaPipeListener(videoEl, canvasEl)

      this._start(videoEl, canvasEl)
    } catch (err) {
      this._hideLoading()

      if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        this._showError(
          'Camera Permission Denied',
          'Please allow camera access in your browser settings and refresh the page.',
          true
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

  _addMediaPipeListener(videoEl, canvasEl) {
    const handler = (e) => {
      this._onResults(e.detail, canvasEl)
    }
    document.addEventListener(MEDIAPIPE_EVENTS.RESULTS, handler)
    return () => document.removeEventListener(MEDIAPIPE_EVENTS.RESULTS, handler)
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

      gestureEngine.process(
        results.multiHandLandmarks,
        handednessList
      )

      const primaryLandmarks = results.multiHandLandmarks[0]
      const fingerCount = countFingers(primaryLandmarks)

      this._smoothX +=
        (primaryLandmarks[8].x * canvasEl.width - this._smoothX) * CONFIG.gesture.smoothingFactor
      this._smoothY +=
        (primaryLandmarks[8].y * canvasEl.height - this._smoothY) * CONFIG.gesture.smoothingFactor

      const indexX = this._smoothX
      const indexY = this._smoothY

      ctx.beginPath()
      ctx.arc(indexX, indexY, 14, 0, Math.PI * 2)
      ctx.fillStyle = '#00ffae'
      ctx.shadowColor = '#00ffae'
      ctx.shadowBlur = 25
      ctx.fill()
      ctx.shadowBlur = 0

      this._handleLockGesture(primaryLandmarks)

      if (!this._hideLandmarks) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          if (typeof drawConnectors !== 'undefined') {
            drawConnectors(ctx, results.multiHandLandmarks[i], HAND_CONNECTIONS, {
              color: '#00FFAE',
              lineWidth: 3,
            })
          }
          if (typeof drawLandmarks !== 'undefined') {
            drawLandmarks(ctx, results.multiHandLandmarks[i], {
              color: '#00E5FF',
              lineWidth: 2,
            })
          }
        }
      }

      if (this.locked) {
        ctx.fillStyle = '#ff4444'
        ctx.font = 'bold 28px Poppins, Arial, sans-serif'
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

      this._detectSwipe(primaryLandmarks[0]?.x || 0)

      if (!this._hideFps) {
        ctx.fillStyle = '#00ffae'
        ctx.font = 'bold 18px Poppins, Arial, sans-serif'
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

      notificationService.info(this.locked ? 'Locked' : 'Unlocked')

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
        notificationService.info('Previous Slide')
      } else {
        keyboardService.execute(ACTION.NEXT_SLIDE)
        notificationService.info('Next Slide')
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
    this._drawCtx = this._drawCanvas.getContext('2d')
    this._resizeDrawCanvas()
  }

  _resizeDrawCanvas() {
    if (!this._drawCanvas) return
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    this._drawCanvas.width = Math.round(w * dpr)
    this._drawCanvas.height = Math.round(h * dpr)
    this._drawCanvas.style.width = w + 'px'
    this._drawCanvas.style.height = h + 'px'
    if (this._drawCtx) {
      this._drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      this._drawCtx.lineCap = 'round'
      this._drawCtx.lineJoin = 'round'
      this._drawCtx.lineWidth = 5
      this._drawCtx.strokeStyle = '#00ffae'
    }
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
      this._toggleCamera()
    })

    gestureEngine.onAction((actionId, gestureId) => {
      keyboardService.execute(actionId)
      this.dashboard.addHistoryEntry(gestureId, actionId, '')
      this.dashboard.updateAction(actionId)
    })
  }

  async _toggleCamera() {
    if (cameraService.running) {
      cameraService.stop()
      if (this.running) {
        this.running = false
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
          this.animationId = null
        }
      }
      this.dashboard.updateCameraStatus('Stopped')
      this.dashboard.setCameraButtonLabel('Start Camera')
      notificationService.info('Camera stopped')
    } else {
      this.dashboard.updateCameraStatus('Starting...')
      this.dashboard.setCameraButtonLabel('Starting...')
      try {
        const videoEl = this._videoEl || getElement('video')
        await cameraService.init(videoEl)
        this.dashboard.updateCameraStatus('Active')
        this.dashboard.setCameraButtonLabel('Camera Active')
        this._start(videoEl, this._canvasEl)
        notificationService.success('Camera started')
      } catch {
        this.dashboard.updateCameraStatus('Error')
        this.dashboard.setCameraButtonLabel('Retry Camera')
      }
    }
  }

  _initSettings() {
    this.settings = new SettingsPanel()

    const settingsChangedHandler = (e) => {
      this._applySettings(e.detail)
    }
    document.addEventListener('settings:changed', settingsChangedHandler)
    this._cleanupFns.push(() => {
      document.removeEventListener('settings:changed', settingsChangedHandler)
    })
  }

  _initEventListeners() {
    let resizeTimer
    const resizeHandler = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (this._canvasEl) this._resizeCanvas(this._canvasEl)
        if (this._drawCanvas) this._resizeDrawCanvas()
      }, 100)
    }

    window.addEventListener('resize', resizeHandler)
    this._cleanupFns.push(() => window.removeEventListener('resize', resizeHandler))

    const orientationHandler = () => {
      setTimeout(() => {
        if (this._canvasEl) this._resizeCanvas(this._canvasEl)
        if (this._drawCanvas) this._resizeDrawCanvas()
      }, 300)
    }
    window.addEventListener('orientationchange', orientationHandler)
    this._cleanupFns.push(() => window.removeEventListener('orientationchange', orientationHandler))

    const beforeUnloadHandler = () => this._destroy()
    window.addEventListener('beforeunload', beforeUnloadHandler)
    this._cleanupFns.push(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

    const cameraErrorHandler = (e) => {
      this.dashboard?.updateCameraStatus('Error: ' + (e.detail?.message || ''))
      notificationService.error('Camera error: ' + (e.detail?.message || ''))
    }
    document.addEventListener(CAMERA_EVENTS.ERROR, cameraErrorHandler)
    this._cleanupFns.push(() => document.removeEventListener(CAMERA_EVENTS.ERROR, cameraErrorHandler))

    const permissionDeniedHandler = () => {
      this.dashboard?.updateCameraStatus('Permission Denied')
      notificationService.error('Camera permission denied')
    }
    document.addEventListener(CAMERA_EVENTS.PERMISSION_DENIED, permissionDeniedHandler)
    this._cleanupFns.push(() => document.removeEventListener(CAMERA_EVENTS.PERMISSION_DENIED, permissionDeniedHandler))

    const gestureDetectedHandler = (e) => {
      const { gesture, handedness, confidence } = e.detail
      this.dashboard?.updateGesture(gesture, confidence || 0.85, handedness || '')
    }
    document.addEventListener(GESTURE_ENGINE_EVENTS.GESTURE_DETECTED, gestureDetectedHandler)
    this._cleanupFns.push(() => document.removeEventListener(GESTURE_ENGINE_EVENTS.GESTURE_DETECTED, gestureDetectedHandler))

    const visibilityHandler = () => {
      if (document.hidden && this.running) {
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
          this.animationId = null
        }
      } else if (!document.hidden && this.running && !this.animationId) {
        const videoEl = this._videoEl
        const canvasEl = this._canvasEl
        if (videoEl && canvasEl) this._start(videoEl, canvasEl)
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
    this._cleanupFns.push(() => document.removeEventListener('visibilitychange', visibilityHandler))
  }

  _loadSettings() {
    const settings = storageService.getAll()
    this._applySettings(settings)
  }

  _applySettings(settings) {
    if (settings.mirrorCamera !== undefined) {
      const videoEl = this._videoEl || getElement('video')
      if (videoEl) {
        this._videoEl = videoEl
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

    if (settings.showLandmarks !== undefined) {
      this._hideLandmarks = !settings.showLandmarks
    }

    if (settings.showFps !== undefined) {
      this._hideFps = !settings.showFps
    }
  }

  _resizeCanvas(canvasEl) {
    if (!canvasEl) return
    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvasEl.width = Math.round(w * dpr)
    canvasEl.height = Math.round(h * dpr)
    canvasEl.style.width = w + 'px'
    canvasEl.style.height = h + 'px'
  }

  _showLoading(message) {
    const el = getElement('loading-screen')
    if (!el) return
    const textEl = getElement('loadingText')
    if (textEl) textEl.textContent = message
    el.classList.remove('loading-screen--hidden')
  }

  _hideLoading() {
    const el = getElement('loading-screen')
    if (el) {
      el.classList.add('loading-screen--hidden')
    }
  }

  _showError(title, message, showRetry = false) {
    const existing = document.querySelector('.error-overlay')
    if (existing) existing.remove()

    const el = document.createElement('div')
    el.className = 'error-overlay'
    el.setAttribute('role', 'alertdialog')
    el.innerHTML = `
      <div class="error-overlay__icon" aria-hidden="true">&#9888;&#65039;</div>
      <h2 class="error-overlay__title">${title}</h2>
      <p class="error-overlay__message">${message}</p>
      ${showRetry ? '<button class="error-overlay__btn" id="errorRetry">Try Again</button>' : ''}
    `
    document.body.appendChild(el)

    const retryBtn = el.querySelector('#errorRetry')
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        el.remove()
        this._boot()
      })
      retryBtn.focus()
    }
  }

  _destroy() {
    this.running = false
    this.locked = false

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this._mediapipeCleanup) {
      this._mediapipeCleanup()
      this._mediapipeCleanup = null
    }

    this._cleanupFns.forEach((fn) => fn())
    this._cleanupFns = []

    cameraService.destroy()
    mediapipeService.destroy()
    this.dashboard?.destroy()
    this.settings?.destroy()
    notificationService.destroy()
    this._swipePoints = []
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App()
})
