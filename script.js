const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");

const statusText = document.getElementById("status");

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

// ============================
// SETTINGS
// ============================

let drawMode = false;
let pointerMode = false;
let locked = false;

let prevX = null;
let prevY = null;

let lastSwipeTime = 0;
let swipeCooldown = 1200;

let fps = 0;
let lastFrameTime = performance.now();

let swipePoints = [];

// ============================
// DRAWING LAYER
// ============================

const drawCanvas = document.createElement("canvas");
drawCanvas.width = window.innerWidth;
drawCanvas.height = window.innerHeight;

const drawCtx = drawCanvas.getContext("2d");

drawCtx.lineCap = "round";
drawCtx.lineJoin = "round";
drawCtx.lineWidth = 5;

// ============================
// FINGER COUNT
// ============================

function countFingers(landmarks) {

  let count = 0;

  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  for (let i = 0; i < tips.length; i++) {

    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      count++;
    }
  }

  return count;
}

// ============================
// FIST DETECTION
// ============================

function isFist(landmarks) {

  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  for (let i = 0; i < tips.length; i++) {

    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      return false;
    }
  }

  return true;
}

// ============================
// SWIPE DETECTION
// ============================

function detectSwipe(x) {

  swipePoints.push({
    x: x,
    time: Date.now()
  });

  swipePoints = swipePoints.filter(
    p => Date.now() - p.time < 300
  );

  if (swipePoints.length < 2) return;

  const dx =
    swipePoints[swipePoints.length - 1].x -
    swipePoints[0].x;

  if (
    Math.abs(dx) > 0.25 &&
    Date.now() - lastSwipeTime > swipeCooldown
  ) {

    lastSwipeTime = Date.now();

    if (dx > 0) {

      statusText.innerHTML =
        "➡️ Swipe Right Detected";

      console.log("PREVIOUS SLIDE");

    } else {

      statusText.innerHTML =
        "⬅️ Swipe Left Detected";

      console.log("NEXT SLIDE");
    }

    swipePoints = [];
  }
}

// ============================
// DRAWING FUNCTION
// ============================

function drawLine(x, y) {

  if (prevX === null || prevY === null) {

    prevX = x;
    prevY = y;

    return;
  }

  drawCtx.strokeStyle = "#00ffae";

  drawCtx.beginPath();

  drawCtx.moveTo(prevX, prevY);
  drawCtx.lineTo(x, y);

  drawCtx.stroke();

  prevX = x;
  prevY = y;
}

// ============================
// RESET DRAW
// ============================

function resetDraw() {

  prevX = null;
  prevY = null;
}

// ============================
// MAIN RESULT LOOP
// ============================

function onResults(results) {

  // FPS
  const now = performance.now();

  fps = Math.round(
    1000 / (now - lastFrameTime)
  );

  lastFrameTime = now;

  // CLEAR
  canvasCtx.clearRect(
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  // CAMERA
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  // DRAW LAYER
  canvasCtx.drawImage(drawCanvas, 0, 0);

  if (results.multiHandLandmarks) {

    for (const landmarks of results.multiHandLandmarks) {

      // HAND LINES
      drawConnectors(
        canvasCtx,
        landmarks,
        HAND_CONNECTIONS,
        {
          color: "#00FFAE",
          lineWidth: 4
        }
      );

      // LANDMARKS
      drawLandmarks(
        canvasCtx,
        landmarks,
        {
          color: "#00E5FF",
          lineWidth: 2
        }
      );

      // FINGER COUNT
      const fingers = countFingers(landmarks);

      // INDEX FINGER
      const indexX =
        landmarks[8].x * canvasElement.width;

      const indexY =
        landmarks[8].y * canvasElement.height;

      // POINTER GLOW
      canvasCtx.beginPath();

      canvasCtx.arc(
        indexX,
        indexY,
        16,
        0,
        Math.PI * 2
      );

      canvasCtx.fillStyle = "#00ffae";
      canvasCtx.shadowColor = "#00ffae";
      canvasCtx.shadowBlur = 25;

      canvasCtx.fill();

      canvasCtx.shadowBlur = 0;

      // LOCK SYSTEM
      if (isFist(landmarks)) {

        locked = !locked;

        statusText.innerHTML =
          locked
          ? "🔒 LOCKED"
          : "🔓 UNLOCKED";

        resetDraw();

        return;
      }

      if (locked) return;

      // MODES
      drawMode = fingers === 1;
      pointerMode = fingers === 2;

      // DRAW MODE
      if (drawMode) {

        drawLine(indexX, indexY);

        statusText.innerHTML =
          `
          ✍️ DRAW MODE
          <br>
          👆 Fingers: ${fingers}
          <br>
          ⚡ FPS: ${fps}
          `;

      }

      // POINTER MODE
      else if (pointerMode) {

        resetDraw();

        statusText.innerHTML =
          `
          🖱️ POINTER MODE
          <br>
          👆 Fingers: ${fingers}
          <br>
          ⚡ FPS: ${fps}
          `;
      }

      // CLEAR
      else if (fingers === 4) {

        drawCtx.clearRect(
          0,
          0,
          drawCanvas.width,
          drawCanvas.height
        );

        statusText.innerHTML =
          `
          🧹 CANVAS CLEARED
          <br>
          ⚡ FPS: ${fps}
          `;
      }

      // SWIPE
      detectSwipe(landmarks[0].x);

      // HUD
      canvasCtx.fillStyle = "#00ffae";

      canvasCtx.font =
        "bold 24px Arial";

      canvasCtx.fillText(
        `FPS: ${fps}`,
        20,
        40
      );

      canvasCtx.fillText(
        `Fingers: ${fingers}`,
        20,
        80
      );

      canvasCtx.fillText(
        locked
        ? "LOCKED"
        : "ACTIVE",
        20,
        120
      );
    }
  }
}

// ============================
// MEDIAPIPE
// ============================

const hands = new Hands({

  locateFile: (file) => {

    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;

  },

});

hands.setOptions({

  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8,

});

hands.onResults(onResults);

// ============================
// CAMERA
// ============================

const camera = new Camera(videoElement, {

  onFrame: async () => {

    await hands.send({
      image: videoElement
    });

  },

  width: 1280,
  height: 720,

});

camera.start();

// ============================
// RESIZE
// ============================

window.addEventListener("resize", () => {

  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;

  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;

});
