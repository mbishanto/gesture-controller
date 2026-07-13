export function dispatchEvent(eventName, detail = {}) {
  document.dispatchEvent(
    new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    })
  )
}

export function isBrowserSupported() {
  return !!(
    navigator.mediaDevices?.getUserMedia &&
    typeof document.createElement('canvas').getContext === 'function'
  )
}

export function getElement(id) {
  return document.getElementById(id)
}

export function sanitize(str) {
  const el = document.createElement('div')
  el.textContent = str
  return el.innerHTML
}
