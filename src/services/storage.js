import CONFIG from '../config/index.js'

class StorageService {
  constructor() {
    this._key = CONFIG.storage.key
    this._cache = null
  }

  _getAll() {
    if (this._cache) return this._cache

    try {
      const raw = localStorage.getItem(this._key)
      this._cache = raw ? JSON.parse(raw) : {}
    } catch {
      this._cache = {}
    }

    return this._cache
  }

  _persist() {
    try {
      localStorage.setItem(this._key, JSON.stringify(this._cache))
    } catch {
      console.warn('StorageService: failed to persist settings')
    }
  }

  get(key, defaultValue = null) {
    const all = this._getAll()
    return key in all ? all[key] : defaultValue
  }

  set(key, value) {
    const all = this._getAll()
    all[key] = value
    this._cache = all
    this._persist()
  }

  getAll() {
    return { ...this._getAll() }
  }

  setAll(settings) {
    this._cache = { ...settings }
    this._persist()
  }

  remove(key) {
    const all = this._getAll()
    delete all[key]
    this._cache = all
    this._persist()
  }

  clear() {
    this._cache = {}
    try {
      localStorage.removeItem(this._key)
    } catch {
      console.warn('StorageService: failed to clear settings')
    }
  }
}

export const storageService = new StorageService()
