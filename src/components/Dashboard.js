import { GESTURE_LABELS, GESTURE_EMOJIS } from '../config/gestures.js'
import { ACTION_LABELS } from '../config/actions.js'
import { getElement } from '../utils/helpers.js'

export class Dashboard {
  constructor() {
    this._elements = {}
    this._gestureHistory = []
    this._listeners = []
    this._callbacks = { settings: null, camera: null }
  }

  init(container) {
    container.insertAdjacentHTML(
      'beforeend',
      this._render()
    )

    this._cacheElements()
    this._attachListeners()
  }

  _render() {
    return `
      <div class="dashboard" id="dashboard">
        <header class="dashboard__header">
          <div class="dashboard__logo">
            Gesture<span>AI</span>
          </div>
          <div class="dashboard__header-actions">
            <button class="dashboard__btn" id="btnSettings" aria-label="Settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
        </header>

        <main class="dashboard__main">
          <div class="dashboard__grid">
            <div class="dashboard__card dashboard__card--gesture" id="gestureCard">
              <div class="card__label">Current Gesture</div>
              <div class="card__gesture-display">
                <span class="card__gesture-emoji" id="gestureEmoji" aria-hidden="true">🖐️</span>
                <span class="card__gesture-name" id="gestureName">Detecting...</span>
              </div>
              <div class="card__confidence">
                Confidence: <span id="gestureConfidence">0%</span>
              </div>
            </div>

            <div class="dashboard__card dashboard__card--action" id="actionCard">
              <div class="card__label">Action Executed</div>
              <div class="card__action-display">
                <span class="card__action-name" id="actionName">None</span>
              </div>
              <div class="card__handedness">
                Hand: <span id="handedness">—</span>
              </div>
            </div>

            <div class="dashboard__card dashboard__card--status" id="statusCard">
              <div class="card__label">System Status</div>
              <div class="card__status-list">
                <div class="card__status-item">
                  <span class="status-dot status-dot--live" id="cameraDot"></span>
                  Camera: <span id="cameraStatus">Initializing...</span>
                </div>
                <div class="card__status-item">
                  <span class="status-dot" id="handDot"></span>
                  Hand: <span id="handStatus">—</span>
                </div>
                <div class="card__status-item">
                  FPS: <span id="fpsDisplay">0</span>
                </div>
                <div class="card__status-item">
                  Mode: <span id="modeDisplay">Active</span>
                </div>
              </div>
            </div>

            <div class="dashboard__card dashboard__card--history" id="historyCard">
              <div class="card__header">
                <div class="card__label">Gesture History</div>
                <button class="card__clear-btn" id="clearHistory" aria-label="Clear history">Clear</button>
              </div>
              <div class="card__history-list" id="historyList">
                <div class="history-empty">No gestures detected yet</div>
              </div>
            </div>
          </div>
        </main>

        <footer class="dashboard__footer">
          <div class="footer__controls">
            <button class="footer__btn footer__btn--primary" id="btnToggleCamera" aria-label="Toggle camera">
              <span class="btn-dot" aria-hidden="true"></span>
              Start Camera
            </button>
            <button class="footer__btn" id="btnToggleLock" aria-label="Toggle lock">
              Lock
            </button>
            <button class="footer__btn" id="btnToggleMode" aria-label="Toggle mode">
              Mouse Mode
            </button>
          </div>
          <div class="footer__hint">
            Show your hand to the camera to control presentations
          </div>
        </footer>
      </div>
    `
  }

  _cacheElements() {
    const ids = [
      'gestureEmoji', 'gestureName', 'gestureConfidence',
      'actionName', 'handedness',
      'cameraDot', 'cameraStatus', 'handDot', 'handStatus',
      'fpsDisplay', 'modeDisplay',
      'historyList', 'clearHistory',
      'btnSettings', 'btnToggleCamera',
      'actionCard',
    ]
    for (const id of ids) {
      this._elements[id] = getElement(id)
    }
  }

  _attachListeners() {
    this._on(this._elements.clearHistory, 'click', () => {
      this.clearHistory()
    })
  }

  _on(el, event, handler) {
    if (!el) return
    el.addEventListener(event, handler)
    this._listeners.push(() => el.removeEventListener(event, handler))
  }

  updateGesture(gestureId, confidence = 0, handedness = '') {
    const label = GESTURE_LABELS[gestureId] || gestureId
    const emoji = GESTURE_EMOJIS[gestureId] || '🖐️'
    const pct = Math.round(confidence * 100)

    if (this._elements.gestureName) this._elements.gestureName.textContent = label
    if (this._elements.gestureEmoji) this._elements.gestureEmoji.textContent = emoji
    if (this._elements.gestureConfidence) this._elements.gestureConfidence.textContent = `${pct}%`
    if (this._elements.handedness) this._elements.handedness.textContent = handedness || '—'
  }

  updateAction(actionId) {
    const label = ACTION_LABELS[actionId] || actionId || 'None'
    if (this._elements.actionName) this._elements.actionName.textContent = label

    if (actionId && actionId !== 'none') {
      const card = this._elements.actionCard
      if (card) {
        card.classList.add('card--flash')
        setTimeout(() => card.classList.remove('card--flash'), 500)
      }
    }
  }

  updateCameraStatus(status) {
    if (this._elements.cameraStatus) this._elements.cameraStatus.textContent = status
    const dot = this._elements.cameraDot
    if (dot) {
      dot.className = 'status-dot'
      if (status === 'Active') dot.classList.add('status-dot--live')
      else if (status.includes('Error')) dot.classList.add('status-dot--error')
      else dot.classList.add('status-dot--warning')
    }
  }

  updateHandStatus(handCount) {
    if (this._elements.handStatus) {
      this._elements.handStatus.textContent = handCount > 0 ? `${handCount} hand(s)` : 'No hand'
    }
    const dot = this._elements.handDot
    if (dot) {
      dot.className = 'status-dot'
      if (handCount > 0) dot.classList.add('status-dot--live')
      else dot.classList.add('status-dot--warning')
    }
  }

  updateFps(fps) {
    if (this._elements.fpsDisplay) this._elements.fpsDisplay.textContent = fps
  }

  updateMode(mode) {
    if (this._elements.modeDisplay) this._elements.modeDisplay.textContent = mode
  }

  addHistoryEntry(gestureId, actionId, handedness) {
    const time = new Date().toLocaleTimeString()

    this._gestureHistory.unshift({ gestureId, actionId, time })

    if (this._gestureHistory.length > 50) {
      this._gestureHistory.pop()
    }

    const list = this._elements.historyList
    if (!list) return

    const emptyEl = list.querySelector('.history-empty')
    if (emptyEl) emptyEl.remove()

    while (list.children.length >= 20) {
      list.removeChild(list.lastChild)
    }

    const div = document.createElement('div')
    div.className = 'history-item'
    div.innerHTML = `
      <span class="history-item__emoji">${GESTURE_EMOJIS[gestureId] || ''}</span>
      <span class="history-item__gesture">${GESTURE_LABELS[gestureId] || gestureId}</span>
      <span class="history-item__action">${ACTION_LABELS[actionId] || ''}</span>
      <span class="history-item__time">${time}</span>
    `
    list.insertBefore(div, list.firstChild)
  }

  clearHistory() {
    this._gestureHistory = []
    const list = this._elements.historyList
    if (list) {
      list.innerHTML = '<div class="history-empty">No gestures detected yet</div>'
    }
  }

  onSettingsClick(handler) {
    this._callbacks.settings = handler
    if (this._settingsHandlerCleanup) {
      this._settingsHandlerCleanup()
      this._listeners = this._listeners.filter(
        (fn) => fn !== this._settingsHandlerCleanup
      )
    }
    this._elements.btnSettings?.addEventListener('click', handler)
    this._settingsHandlerCleanup = () => {
      this._elements.btnSettings?.removeEventListener('click', handler)
    }
    this._listeners.push(this._settingsHandlerCleanup)
  }

  onToggleCamera(handler) {
    this._callbacks.camera = handler
    if (this._cameraHandlerCleanup) {
      this._cameraHandlerCleanup()
      this._listeners = this._listeners.filter(
        (fn) => fn !== this._cameraHandlerCleanup
      )
    }
    this._elements.btnToggleCamera?.addEventListener('click', handler)
    this._cameraHandlerCleanup = () => {
      this._elements.btnToggleCamera?.removeEventListener('click', handler)
    }
    this._listeners.push(this._cameraHandlerCleanup)
  }

  setCameraButtonLabel(label) {
    const btn = this._elements.btnToggleCamera
    if (btn) btn.innerHTML = `<span class="btn-dot" aria-hidden="true"></span>${label}`
  }

  destroy() {
    this._listeners.forEach((fn) => fn())
    this._listeners = []
    this._elements = {}
    this._gestureHistory = []
  }
}
