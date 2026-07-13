import { sanitize } from '../utils/helpers.js'

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
}

class NotificationService {
  constructor() {
    this._container = null
    this._timeouts = new Map()
    this._idCounter = 0
  }

  _ensureContainer() {
    if (this._container) return

    this._container = document.createElement('div')
    this._container.setAttribute('id', 'notification-container')
    this._container.setAttribute('role', 'alert')
    this._container.setAttribute('aria-live', 'polite')
    document.body.appendChild(this._container)
  }

  show(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
    this._ensureContainer()

    const id = ++this._idCounter
    const el = document.createElement('div')
    el.className = `notification notification--${type}`
    el.setAttribute('data-id', id)

    const iconMap = {
      [NOTIFICATION_TYPES.SUCCESS]: '✓',
      [NOTIFICATION_TYPES.ERROR]: '✕',
      [NOTIFICATION_TYPES.INFO]: 'ℹ',
      [NOTIFICATION_TYPES.WARNING]: '⚠',
    }

    el.innerHTML = `
      <span class="notification__icon">${iconMap[type] || 'ℹ'}</span>
      <span class="notification__message">${sanitize(message)}</span>
    `

    this._container.appendChild(el)

    requestAnimationFrame(() => el.classList.add('notification--visible'))

    const timeout = setTimeout(() => this._remove(id), duration)
    this._timeouts.set(id, timeout)

    return id
  }

  success(message, duration) {
    return this.show(message, NOTIFICATION_TYPES.SUCCESS, duration)
  }

  error(message, duration) {
    return this.show(message, NOTIFICATION_TYPES.ERROR, duration)
  }

  info(message, duration) {
    return this.show(message, NOTIFICATION_TYPES.INFO, duration)
  }

  warning(message, duration) {
    return this.show(message, NOTIFICATION_TYPES.WARNING, duration)
  }

  _remove(id) {
    const timeout = this._timeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this._timeouts.delete(id)
    }

    const el = this._container?.querySelector(`[data-id="${id}"]`)
    if (el) {
      el.classList.remove('notification--visible')
      el.classList.add('notification--hiding')
      setTimeout(() => {
        if (el.parentNode) el.remove()
      }, 300)
    }
  }

  dismissAll() {
    const ids = Array.from(this._timeouts.keys())
    ids.forEach((id) => this._remove(id))
  }

  destroy() {
    this.dismissAll()
    if (this._container?.parentNode) {
      this._container.remove()
    }
    this._container = null
  }
}

export const notificationService = new NotificationService()
