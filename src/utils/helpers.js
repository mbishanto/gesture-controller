export function debounce(fn, delayMs = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delayMs)
  }
}

export function throttle(fn, limitMs = 100) {
  let inThrottle = false
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limitMs)
    }
  }
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

export function dispatchEvent(eventName, detail = {}) {
  document.dispatchEvent(
    new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    })
  )
}

export function listen(eventName, handler) {
  document.addEventListener(eventName, handler)
  return () => document.removeEventListener(eventName, handler)
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export function isBrowserSupported() {
  return !!(
    navigator.mediaDevices?.getUserMedia &&
    typeof document.createElement('canvas').getContext === 'function'
  )
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getElement(id) {
  const el = document.getElementById(id)
  if (!el) console.warn(`Element #${id} not found`)
  return el
}
