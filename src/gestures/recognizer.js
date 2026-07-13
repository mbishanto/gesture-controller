import { GESTURE } from '../config/gestures.js'

const TIP_IDS = [4, 8, 12, 16, 20]
const PIP_IDS = [2, 6, 10, 14, 18]
const MCP_IDS = [1, 5, 9, 13, 17]
const WRIST_ID = 0

export function recognizeGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return GESTURE.NONE

  const fingerStates = getFingerStates(landmarks)
  const fingerCount = fingerStates.filter(Boolean).length

  if (fingerCount === 0 && isFist(landmarks)) return GESTURE.FIST
  if (fingerCount === 1 && isThumbUp(landmarks, fingerStates)) return GESTURE.THUMBS_UP
  if (fingerCount === 1 && isThumbDown(landmarks, fingerStates)) return GESTURE.THUMBS_DOWN
  if (fingerCount === 1 && !fingerStates[0]) return GESTURE.POINTER
  if (fingerCount === 1) return GESTURE.POINTER
  if (fingerCount === 2 && isPeace(landmarks, fingerStates)) return GESTURE.PEACE
  if (fingerCount === 2) return GESTURE.PEACE
  if (fingerCount === 3) return GESTURE.THREE
  if (fingerCount === 4) return GESTURE.FOUR
  if (fingerCount === 5 && isOpenPalm(landmarks, fingerStates)) return GESTURE.OPEN_PALM
  if (fingerCount === 5) return GESTURE.OPEN_PALM

  if (isOK(landmarks, fingerStates)) return GESTURE.OK
  if (isRock(landmarks, fingerStates)) return GESTURE.ROCK
  if (isLove(landmarks, fingerStates)) return GESTURE.LOVE

  if (fingerCount === 0) return GESTURE.FIST

  return GESTURE.NONE
}

export function getFingerStates(landmarks) {
  const states = []

  states.push(getThumbState(landmarks))

  for (let i = 1; i < 5; i++) {
    const tip = landmarks[TIP_IDS[i]]
    const pip = landmarks[PIP_IDS[i]]

    if (!tip || !pip) {
      states.push(false)
      continue
    }

    states.push(tip.y < pip.y)
  }

  return states
}

function getThumbState(landmarks) {
  const tip = landmarks[TIP_IDS[0]]
  const ip = landmarks[3]
  const mcp = landmarks[MCP_IDS[0]]

  if (!tip || !ip || !mcp) return false

  const tipToIP = Math.abs(tip.x - ip.x)
  const threshold = Math.abs(mcp.x - ip.x) * 0.5

  return tipToIP > threshold
}

export function countFingers(landmarks) {
  return getFingerStates(landmarks).filter(Boolean).length
}

export function isFist(landmarks) {
  const states = getFingerStates(landmarks)
  return states.every((s) => !s)
}

export function isOpenPalm(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)
  const allExtended = states.every(Boolean)

  const spread = getFingerSpread(landmarks)
  return allExtended && spread > 0.15
}

export function isThumbUp(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)
  if (!states[0]) return false

  for (let i = 1; i < 5; i++) {
    if (states[i]) return false
  }

  const thumbTip = landmarks[TIP_IDS[0]]
  const thumbMCP = landmarks[MCP_IDS[0]]
  const wrist = landmarks[WRIST_ID]

  if (!thumbTip || !thumbMCP || !wrist) return false

  return thumbTip.y < wrist.y - 0.05
}

export function isThumbDown(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)
  if (!states[0]) return false

  for (let i = 1; i < 5; i++) {
    if (states[i]) return false
  }

  const thumbTip = landmarks[TIP_IDS[0]]
  const wrist = landmarks[WRIST_ID]

  if (!thumbTip || !wrist) return false

  return thumbTip.y > wrist.y + 0.05
}

export function isPeace(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)

  if (!states[1] || !states[2]) return false
  if (states[3] || states[4]) return false

  const indexTip = landmarks[TIP_IDS[1]]
  const middleTip = landmarks[TIP_IDS[2]]
  const indexMCP = landmarks[MCP_IDS[1]]

  if (!indexTip || !middleTip || !indexMCP) return false

  const spread = Math.abs(indexTip.x - middleTip.x)
  return spread > 0.04
}

export function isOK(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)

  if (states[1] || states[2] || states[3] || states[4]) return false

  const thumbTip = landmarks[TIP_IDS[0]]
  const indexTip = landmarks[TIP_IDS[1]]

  if (!thumbTip || !indexTip) return false

  const dx = thumbTip.x - indexTip.x
  const dy = thumbTip.y - indexTip.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance < 0.06
}

export function isRock(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)

  if (!states[1] || !states[4]) return false
  if (states[2] || states[3]) return false

  return true
}

export function isLove(landmarks, fingerStates) {
  const states = fingerStates || getFingerStates(landmarks)

  if (states[0] && states[1] && states[2]) return false
  if (!states[0]) return false
  if (!states[1]) return false

  const thumbTip = landmarks[TIP_IDS[0]]
  const indexTip = landmarks[TIP_IDS[1]]

  if (!thumbTip || !indexTip) return false

  const dx = thumbTip.x - indexTip.x
  const dy = thumbTip.y - indexTip.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance < 0.08
}

export function isWaveGesture(landmarks, history) {
  if (!history || history.length < 10) return false

  const recent = history.slice(-10)
  const xValues = recent.map((h) => h.wristX)
  const min = Math.min(...xValues)
  const max = Math.max(...xValues)

  return max - min > 0.15
}

function getFingerSpread(landmarks) {
  const idxMcp = landmarks[MCP_IDS[1]]
  const pinkyMcp = landmarks[MCP_IDS[4]]

  if (!idxMcp || !pinkyMcp) return 0

  return Math.abs(idxMcp.x - pinkyMcp.x)
}

function getHandOrientation(landmarks) {
  const wrist = landmarks[WRIST_ID]
  const middleMcp = landmarks[MCP_IDS[2]]

  if (!wrist || !middleMcp) return 'unknown'

  return middleMcp.y < wrist.y ? 'up' : 'down'
}
