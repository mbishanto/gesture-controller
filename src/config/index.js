const CONFIG = {
  camera: {
    width: 1280,
    height: 720,
    facingMode: 'user',
    fps: 30,
  },
  mediapipe: {
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8,
  },
  gesture: {
    confidenceThreshold: 0.7,
    cooldownMs: 300,
    smoothingFactor: 0.35,
    swipeThreshold: 0.25,
    swipeCooldownMs: 1200,
    lockCooldownMs: 1500,
    historySize: 50,
  },
  ui: {
    theme: 'dark',
    mirrorCamera: true,
    showFps: true,
    showLandmarks: true,
  },
  storage: {
    key: 'gesture-controller-settings',
  },
}

export default CONFIG
