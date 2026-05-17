# ✋ Smart Hand Gesture Presentation Controller

This is a computer vision–based smart presentation controller built using Python, OpenCV, and MediaPipe, enabling users to control presentations using hand gestures instead of traditional input devices.
The system supports slide navigation through swipe gestures in presentation mode, along with real-time cursor (pointer) control inside presentations, allowing users to move and interact with slides hands-free. Additionally, virtual annotation features such as drawing, undo, and clear operations are performed within a separate OpenCV canvas, creating an interactive hybrid experience.

---

## 🧠 Core Functionalities

* 🎞️ Gesture-based presentation navigation

  * Swipe left → Next slide  
  * Swipe right → Previous slide  

* ✍️ Virtual annotation system

  * Draw on screen using finger gestures  
  * Pointer mode for highlighting  
  * Undo previous drawings  
  * Clear all annotations  

* 🔒 Gesture lock/unlock control

  * Fist gesture used to enable/disable controls

---

## ✨ Features

* ✋ Real-time hand tracking and gesture recognition  
* 🎯 Static gesture detection for annotation controls  
* ↔️ Dynamic swipe detection for slide navigation  
* 🖍️ Virtual drawing canvas overlay  
* 👆 Pointer mode for presentation emphasis  
* ↩️ Stroke-based undo functionality  
* 🧹 Clear-all annotation gesture  
* 🔐 Lock/unlock gesture safety mechanism  
* ⚡ Gesture debouncing and stabilization logic  
* 🎥 Real-time webcam-based interaction  

---

## 🛠️ Tech Stack

### Computer Vision

* OpenCV  
* MediaPipe  
* NumPy  

### Automation

* PyAutoGUI  

### Language

* Python  

---
## Demo Video
Watch the project demo here:
https://www.dropbox.com/scl/fi/3djpghtsrsc6jzzu9eo72/final-vid.mp4?rlkey=5p366qcw5n5o2473pfrt7y7qj&st=phip5v4y&dl=0

## 📂 Project Structure

```bash
Hand-Gesture-Smart-Presentation-Controller/
│
├── src/
│   ├── finger_utils.py
│   ├── swipe_detector.py
│   └── overlay.py
│
├── main.py
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/Hand-Gesture-Smart-Presentation-Controller.git

cd Hand-Gesture-Smart-Presentation-Controller
```

---

### 2️⃣ Create virtual environment

```bash
python -m venv venv
```

Activate:

```bash
venv\Scripts\activate
```

---

### 3️⃣ Install dependencies

```bash
pip install opencv-python mediapipe pyautogui numpy
```

---

### 4️⃣ Run the project

```bash
python main.py
```

---

## 🎮 Gesture Controls

| Gesture | Action |
|--------|--------|
| ☝️ 1 Finger | Draw |
| ✌️ 2 Fingers | Pointer |
| 🤟 3 Fingers | Undo |
| 🖐️ 4 Fingers | Clear |
| ✊ Fist | Lock / Unlock |
| 👋 Swipe Left | Next Slide |
| 👋 Swipe Right | Previous Slide |

---

## 🚀 How It Works

The system uses **MediaPipe hand landmarks** to detect both:

### Static Gestures
Used for:

- Drawing  
- Pointer mode  
- Undo  
- Clear  
- Lock/Unlock  

---

### Dynamic Gestures
Used for:

- Swipe-based slide navigation

The system combines:

- Finger counting logic  
- Gesture stabilization  
- Debounce filtering  
- Swipe motion tracking  
- Stroke history for undo support  

to ensure reliable real-time performance.

---

## 🔮 Future Improvements

* PowerPoint native annotation integration  
* Multi-hand gesture support  
* Gesture customization settings  
* Presentation laser mode  
* AI-powered gesture adaptation  

---

## ⭐ Support

If you like this project, consider giving it a star on GitHub!

---
