import { GESTURE_LABELS, GESTURE_EMOJIS } from '../config/gestures.js'
import { ACTION, ACTION_LABELS } from '../config/actions.js'
import { storageService } from '../services/storage.js'

export class SettingsPanel {
  constructor() {
    this._panel = null
    this._overlay = null
    this._visible = false
    this._onClose = null
    this._cleanupFns = []
  }

  show() {
    if (!this._panel) this._create()
    this._overlay.classList.add('settings--visible')
    this._panel.classList.remove('hidden')
    this._panel.classList.add('settings--visible')
    this._visible = true
    this._loadSettings()
    this._panel.querySelector('#settingsClose')?.focus()
  }

  hide() {
    if (!this._visible) return
    this._overlay.classList.remove('settings--visible')
    this._panel.classList.remove('settings--visible')
    this._panel.classList.add('hidden')
    this._visible = false
    document.querySelector('#btnSettings')?.focus()
  }

  toggle() {
    this._visible ? this.hide() : this.show()
  }

  _create() {
    this._overlay = document.createElement('div')
    this._overlay.className = 'settings-overlay'
    const overlayHandler = (e) => {
      if (e.target === this._overlay) this.hide()
    }
    this._overlay.addEventListener('click', overlayHandler)
    this._cleanupFns.push(() => this._overlay.removeEventListener('click', overlayHandler))

    this._panel = document.createElement('div')
    this._panel.className = 'settings-panel'
    this._panel.setAttribute('role', 'dialog')
    this._panel.setAttribute('aria-label', 'Settings')
    this._panel.setAttribute('aria-modal', 'true')
    this._panel.setAttribute('hidden', '')

    this._panel.innerHTML = this._render()
    this._attachEvents()
    this._attachKeyboardListener()

    document.body.appendChild(this._overlay)
    document.body.appendChild(this._panel)
  }

  _attachKeyboardListener() {
    const handler = (e) => {
      if (e.key === 'Escape' && this._visible) {
        this.hide()
      }
      if (e.key === 'Tab' && this._visible) {
        this._trapFocus(e)
      }
    }
    document.addEventListener('keydown', handler)
    this._cleanupFns.push(() => document.removeEventListener('keydown', handler))
  }

  _trapFocus(e) {
    const focusable = this._panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  _render() {
    const gestureEntries = Object.entries(GESTURE_LABELS)
      .filter(([id]) => id !== 'none')

    const actionOptions = Object.entries(ACTION_LABELS)
      .map(
        ([id, label]) =>
          `<option value="${id}">${label}</option>`
      )
      .join('')

    const gestureRows = gestureEntries
      .map(
        ([id, label]) => `
          <div class="settings__row">
            <div class="settings__gesture-label">
              <span class="settings__emoji" aria-hidden="true">${GESTURE_EMOJIS[id] || ''}</span>
              <span>${label}</span>
            </div>
            <select class="settings__select" data-gesture="${id}" aria-label="Action for ${label}">
              ${actionOptions}
            </select>
          </div>
        `
      )
      .join('')

    return `
      <div class="settings__header">
        <h2 class="settings__title" id="settingsTitle">Settings</h2>
        <button class="settings__close" id="settingsClose" aria-label="Close settings">&times;</button>
      </div>

      <div class="settings__body">
        <section class="settings__section">
          <h3 class="settings__section-title">Camera</h3>
          <div class="settings__row">
            <label class="settings__label" for="settingCamera">Camera Source</label>
            <select class="settings__select" id="settingCamera">
              <option value="default">Default Camera</option>
            </select>
          </div>
          <div class="settings__row">
            <label class="settings__label" for="settingMirror">Mirror Camera</label>
            <label class="toggle">
              <input type="checkbox" id="settingMirror" checked>
              <span class="toggle__slider"></span>
            </label>
          </div>
        </section>

        <section class="settings__section">
          <h3 class="settings__section-title">Detection</h3>
          <div class="settings__row">
            <label class="settings__label" for="settingConfidence">Confidence Threshold</label>
            <div class="settings__range-group">
              <input type="range" id="settingConfidence" min="0.3" max="0.95" step="0.05" value="0.7" aria-label="Confidence threshold">
              <span class="settings__range-value" id="confidenceValue">0.70</span>
            </div>
          </div>
          <div class="settings__row">
            <label class="settings__label" for="settingCooldown">Gesture Cooldown (ms)</label>
            <input type="number" id="settingCooldown" min="100" max="2000" step="50" value="300" aria-label="Gesture cooldown in milliseconds">
          </div>
        </section>

        <section class="settings__section">
          <h3 class="settings__section-title">Performance</h3>
          <div class="settings__row">
            <label class="settings__label" for="settingFpsLimit">FPS Limit</label>
            <select class="settings__select" id="settingFpsLimit">
              <option value="15">15 FPS</option>
              <option value="30" selected>30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
          <div class="settings__row">
            <label class="settings__label" for="settingLandmarks">Show Landmarks</label>
            <label class="toggle">
              <input type="checkbox" id="settingLandmarks" checked>
              <span class="toggle__slider"></span>
            </label>
          </div>
          <div class="settings__row">
            <label class="settings__label" for="settingShowFps">Show FPS</label>
            <label class="toggle">
              <input type="checkbox" id="settingShowFps" checked>
              <span class="toggle__slider"></span>
            </label>
          </div>
        </section>

        <section class="settings__section">
          <h3 class="settings__section-title">Gesture Mapping</h3>
          <div class="settings__gesture-mappings">
            ${gestureRows}
          </div>
        </section>
      </div>

      <div class="settings__footer">
        <button class="settings__btn settings__btn--secondary" id="settingsReset">Reset Defaults</button>
        <button class="settings__btn settings__btn--primary" id="settingsSave">Save Settings</button>
      </div>
    `
  }

  _attachEvents() {
    const closeHandler = () => this.hide()
    this._panel.querySelector('#settingsClose').addEventListener('click', closeHandler)
    this._cleanupFns.push(() => this._panel.querySelector('#settingsClose')?.removeEventListener('click', closeHandler))

    const saveHandler = () => this._save()
    this._panel.querySelector('#settingsSave').addEventListener('click', saveHandler)
    this._cleanupFns.push(() => this._panel.querySelector('#settingsSave')?.removeEventListener('click', saveHandler))

    const resetHandler = () => this._reset()
    this._panel.querySelector('#settingsReset').addEventListener('click', resetHandler)
    this._cleanupFns.push(() => this._panel.querySelector('#settingsReset')?.removeEventListener('click', resetHandler))

    const confidenceHandler = (e) => {
      const val = this._panel.querySelector('#confidenceValue')
      if (val) val.textContent = parseFloat(e.target.value).toFixed(2)
    }
    this._panel.querySelector('#settingConfidence').addEventListener('input', confidenceHandler)
    this._cleanupFns.push(() => this._panel.querySelector('#settingConfidence')?.removeEventListener('input', confidenceHandler))

    const cooldownHandler = (e) => {
      const v = parseInt(e.target.value)
      if (v < 100) e.target.value = 100
      if (v > 2000) e.target.value = 2000
    }
    this._panel.querySelector('#settingCooldown').addEventListener('change', cooldownHandler)
    this._cleanupFns.push(() => this._panel.querySelector('#settingCooldown')?.removeEventListener('change', cooldownHandler))
  }

  _loadSettings() {
    const settings = storageService.getAll()

    const mirror = this._panel.querySelector('#settingMirror')
    if (mirror) mirror.checked = settings.mirrorCamera !== false

    const confidence = this._panel.querySelector('#settingConfidence')
    if (confidence) {
      confidence.value = settings.confidenceThreshold || 0.7
      const val = this._panel.querySelector('#confidenceValue')
      if (val) val.textContent = parseFloat(confidence.value).toFixed(2)
    }

    const cooldown = this._panel.querySelector('#settingCooldown')
    if (cooldown) cooldown.value = settings.gestureCooldown || 300

    const fpsLimit = this._panel.querySelector('#settingFpsLimit')
    if (fpsLimit) fpsLimit.value = settings.fpsLimit || '30'

    const landmarks = this._panel.querySelector('#settingLandmarks')
    if (landmarks) landmarks.checked = settings.showLandmarks !== false

    const showFps = this._panel.querySelector('#settingShowFps')
    if (showFps) showFps.checked = settings.showFps !== false

    const savedMappings = settings.gestureMappings
    if (savedMappings) {
      for (const [gestureId, actionId] of Object.entries(savedMappings)) {
        const select = this._panel.querySelector(`[data-gesture="${gestureId}"]`)
        if (select) select.value = actionId
      }
    }
  }

  _save() {
    const getVal = (id) => this._panel.querySelector(id)

    const settings = {
      mirrorCamera: getVal('#settingMirror')?.checked ?? true,
      confidenceThreshold: parseFloat(getVal('#settingConfidence')?.value || '0.7'),
      gestureCooldown: parseInt(getVal('#settingCooldown')?.value || '300'),
      fpsLimit: parseInt(getVal('#settingFpsLimit')?.value || '30'),
      showLandmarks: getVal('#settingLandmarks')?.checked ?? true,
      showFps: getVal('#settingShowFps')?.checked ?? true,
    }

    const gestureMappings = {}
    const selects = this._panel.querySelectorAll('[data-gesture]')
    selects.forEach((select) => {
      gestureMappings[select.dataset.gesture] = select.value
    })
    settings.gestureMappings = gestureMappings

    storageService.setAll(settings)

    this._applySettings(settings)

    this.hide()
  }

  _applySettings(settings) {
    document.dispatchEvent(
      new CustomEvent('settings:changed', { detail: settings })
    )
  }

  _reset() {
    storageService.clear()
    this._loadSettings()
    this._applySettings({
      mirrorCamera: true,
      confidenceThreshold: 0.7,
      gestureCooldown: 300,
      fpsLimit: 30,
      showLandmarks: true,
      showFps: true,
    })
  }

  isVisible() {
    return this._visible
  }

  destroy() {
    this._visible = false
    this._cleanupFns.forEach((fn) => fn())
    this._cleanupFns = []
    this._overlay?.remove()
    this._panel?.remove()
    this._overlay = null
    this._panel = null
  }
}
