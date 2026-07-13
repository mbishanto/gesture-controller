export class FPSCounter {
  constructor() {
    this._frames = 0
    this._lastTime = performance.now()
    this._fps = 0
    this._updateInterval = 500
    this._lastUpdate = 0
  }

  tick() {
    this._frames++
    const now = performance.now()

    if (now - this._lastUpdate >= this._updateInterval) {
      this._fps = Math.round(
        (this._frames * 1000) / (now - this._lastUpdate)
      )
      this._frames = 0
      this._lastUpdate = now
    }

    return this._fps
  }

  get value() {
    return this._fps
  }

  reset() {
    this._frames = 0
    this._lastTime = performance.now()
    this._fps = 0
    this._lastUpdate = 0
  }
}
