import CONFIG from '../config/index.js'
import { GESTURE, GESTURE_LABELS, GESTURE_EMOJIS } from '../config/gestures.js'
import { ACTION, ACTION_LABELS } from '../config/actions.js'
import { gestureRegistry } from '../gestures/registry.js'
import { storageService } from '../services/storage.js'

export class SettingsPanel {
  constructor() {
    this._panel = null
    this._overlay = null
    this._visible = false
    this._onClose = null
  }

  show() {
    if (!this._panel) this._create()
    this._overlay.classList.add('settings--visible')
    this._panel.classList.add('settings--visible')
    this._visible = true
    this._loadSettings()
  }

  hide() {
    if (!this._visible) return
    this._overlay.classList.remove('settings--visible')
    this._panel.classList.remove('settings--visible')
    this._visible = false
  }

  toggle() {
    this._visible ? this.hide() : this.show()
  }

  _create() {
    this._overlay = document.createElement('div')
    this._overlay.className = 'settings-overlay'
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.hide()
    })

    this._panel = document.createElement('div')
    this._panel.className = 'settings-panel'
    this._panel.setAttribute('role', 'dialog')
    this._panel.setAttribute('aria-label', 'Settings')

    this._panel.innerHTML = this._render()
    this._attachEvents()

    document.body.appendChild(this._overlay)
    document.body.appendChild(this._panel)
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
              <span class="settings__emoji">${GESTURE_EMOJIS[id] || ''}</span>
              <span>${label}</span>
            </div>
            <select class="settings__select" data-gesture="${id}">
              ${actionOptions}
            </select>
          </div>
        `
      )
      .join('')

    return `
      <div class="settings__header">
        <h2 class="settings__title">Settings</h2>
        <button class="settings__close" id="settingsClose" aria-label="Close settings">&times;</button>
      </div>

      <div class="settings__body">
        <section class="settings__section">
          <h3 class="settings__section-title">📷 Camera</h3>
          <div class="settings__row">
            <label class="settings__label">Camera Source</label>
            <select class="settings__select" id="settingCamera">
              <option value="default">Default Camera</option>
            </select>
          </div>
          <div class="settings__row">
            <label class="settings__label">Mirror Camera</label>
            <label class="toggle">
              <input type="checkbox" id="settingMirror" checked>
              <span class="toggle__slider"></span>
            </label>
          </div>
        </section>

        <section class="settings__section">
          <h3 class="settings__section-title">🎯 Detection</h3>
          <div class="settings__row">
            <label class="settings__label">Confidence Threshold</label>
            <div class="settings__range-group">
              <input type="range" id="settingConfidence" min="0.3" max="0.95" step="0.05" value="0.7">
              <span class="settings__range-value" id="confidenceValue">0.70</span>
            </div>
          </div>
          <div class="settings__row">
            <label class="settings__label">Gesture Sensitivity</label>
            <div class="settings__range-group">
              <input type="range" id="settingSensitivity" min="0.1" max="1.0" step="0.05" value="0.5">
              <span class="settings__range-value" id="sensitivityValue">0.50</span>
            </div>
          </div>
          <div class="settings__row">
            <label class="settings__label">Gesture Cooldown (ms)</label>
            <input type="number" id="settingCooldown" min="100" max="2000" step="50" value="300">
          </div>
        </section>

        <section class="settings__section">
          <h3 class="settings__section-title">⚡ Performance</h3>
          <div class="settings__row">
            <label class="settings__label">FPS Limit</label>
            <select class="settings__select" id="settingFpsLimit">
              <option value="15">15 FPS</option>
              <option value="30" selected>30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
          <div class="settings__row">
            <label class="settings__label">Show Landmarks</label>
            <label class="toggle">
              <input type="checkbox" id="settingLandmarks" checked>
              <span class="toggle__slider"></span>
            </label>
          </div>
          <div class="settings__row">
            <label class="settings__label">Show FPS</label>
            <label class="toggle">
              <input type="checkbox" id="settingShowFps" checked>
              <span class="toggle__slider"></span>
            </label>
          </div>
        </section>

        <section class="settings__section">
          <h3 class="settings__section-title">🎨 Gesture Mapping</h3>
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
    this._panel.querySelector('#settingsClose').addEventListener('click', () => this.hide())
    this._panel.querySelector('#settingsSave').addEventListener('click', () => this._save())
    this._panel.querySelector('#settingsReset').addEventListener('click', () => this._reset())

    this._panel.querySelector('#settingConfidence').addEventListener('input', (e) => {
      this._panel.querySelector('#confidenceValue').textContent = parseFloat(e.target.value).toFixed(2)
    })

    this._panel.querySelector('#settingSensitivity').addEventListener('input', (e) => {
      this._panel.querySelector('#sensitivityValue').textContent = parseFloat(e.target.value).toFixed(2)
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._visible) this.hide()
    })
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
    this._applySettings(storageService.getAll())
  }

  isVisible() {
    return this._visible
  }

  destroy() {
    this._overlay?.remove()
    this._panel?.remove()
  }
}
