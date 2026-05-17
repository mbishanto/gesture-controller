import cv2
import mediapipe as mp
import pyautogui
import time

from collections import deque
from src.finger_utils import count_fingers, get_static_gesture, is_fist
from src.swipe_detector import SwipeDetector
from src.overlay import DrawingOverlay

pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils


# ---------------- DEBOUNCER ----------------
class StaticDebouncer:
    def __init__(self, hold_time=0.3):
        self.hold_time = hold_time
        self.current_gesture = None
        self.gesture_start_time = None

    def check(self, gesture):
        now = time.time()

        if gesture != self.current_gesture:
            self.current_gesture = gesture
            self.gesture_start_time = now if gesture else None
            return None

        if gesture is None:
            return None

        if now - self.gesture_start_time >= self.hold_time:
            return gesture

        return None

    def reset(self):
        self.current_gesture = None
        self.gesture_start_time = None


# ---------------- MAIN ----------------
def main():

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.82,
        min_tracking_confidence=0.75
    )

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    swiper = SwipeDetector(window=12, threshold=0.18, cooldown=1.2)
    overlay = DrawingOverlay(1280, 720)
    debounce = StaticDebouncer(0.3)
    fist_debounce = StaticDebouncer(0.3)

    is_locked = True
    fist_confirmed = False
    last_toggle_time = 0
    TOGGLE_COOLDOWN = 0.8

    active_mode = None
    swipe_label = ""
    swipe_time = 0
    last_undo_time = 0
    UNDO_COOLDOWN = 1.5
    prev_x, prev_y = 0, 0
    smooth_factor = 0.3
    click_ready = True
    pointer_prev = None
    pointer_last_move_time = time.time()
    CLICK_DELAY = 0.35
    MOVE_THRESHOLD = 12

    stable_gesture = None
    gesture_start_time = 0

    print("Starting in 5 seconds...")
    time.sleep(5)
    print("GO — show FIST to unlock!")

    # ---------------- LOOP ----------------
    gesture_history = deque(maxlen=7)
    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        results = hands.process(rgb)
        rgb.flags.writeable = True

        lm = None
        handedness = None
        raw_static = None

        if results.multi_hand_landmarks and results.multi_handedness:

            hand_lm = results.multi_hand_landmarks[0]
            hand_info = results.multi_handedness[0]
            handedness = hand_info.classification[0].label
            lm = hand_lm.landmark

            mp_draw.draw_landmarks(frame, hand_lm, mp_hands.HAND_CONNECTIONS)

            # ---------------- SWIPE ----------------
            wrist_x = (lm[0].x + lm[9].x) / 2
            wrist_y = (lm[0].y + lm[9].y) / 2
            swipe = swiper.update(wrist_x, wrist_y)

            if swipe == "swipe_left":
                pyautogui.press("right")
                swipe_label = "Next Slide"
                swipe_time = time.time()

            elif swipe == "swipe_right":
                pyautogui.press("left")
                swipe_label = "Prev Slide"
                swipe_time = time.time()

            # ---------------- FINGER SMOOTHING ----------------
            n = count_fingers(lm, handedness)
            gesture_history.append(n)

            stable_n = max(set(gesture_history), key=gesture_history.count)

            # ---------------- GESTURE ----------------

            # PRIORITY RULES
            if is_fist(lm, handedness):
                raw_static = "FIST"

            elif n == 1:
                raw_static = "DRAW"

            elif n == 2:
                raw_static = "POINTER"

            elif n == 3:
                raw_static = "UNDO"

            elif n == 4:
                raw_static = "CLEAR"

            else:
                raw_static = None

            # ---------------- FIST LOCK ----------------
            now = time.time()
            fist_held = is_fist(lm, handedness)

            if fist_held and not fist_confirmed:
                if time.time() - last_toggle_time > TOGGLE_COOLDOWN:
                    confirmed = fist_debounce.check("FIST")

                    if confirmed == "FIST":
                        is_locked = not is_locked
                        fist_confirmed = True
                        last_toggle_time = time.time()
                        active_mode = None 

            elif not fist_held:
                fist_confirmed = False

            # ---------------- GESTURES ONLY WHEN UNLOCKED ----------------
            if not is_locked:
                # confirmed = debounce.check(raw_static)
                instant_actions = {"UNDO", "CLEAR"}

                if raw_static in instant_actions:
                    confirmed = raw_static
                else:
                    confirmed = debounce.check(raw_static)
                
                if confirmed != "DRAW":
                    overlay.reset_line()

                if confirmed == "DRAW":
                    active_mode = "DRAW"

                elif confirmed == "POINTER":
                    active_mode = "POINTER"
                    if lm is not None:
                        x = lm[8].x * pyautogui.size().width
                        y = lm[8].y * pyautogui.size().height
                        prev_x = prev_x + (x - prev_x) * smooth_factor
                        prev_y = prev_y + (y - prev_y) * smooth_factor
                        pyautogui.moveTo(prev_x, prev_y)

                        now = time.time()

                        # detect movement (simple jitter check)
                        if pointer_prev is not None:
                            dx = abs(x - pointer_prev[0])
                            dy = abs(y - pointer_prev[1])

                            if dx > MOVE_THRESHOLD or dy > MOVE_THRESHOLD:
                                pointer_last_move_time = now  # user is moving

                            # if user stopped moving for a short time → CLICK
                            elif now - pointer_last_move_time > CLICK_DELAY:
                                pyautogui.click()
                                pointer_last_move_time = now  # prevent repeated clicks

                        pointer_prev = (x, y)

                elif confirmed == "UNDO":
                    if time.time() - last_undo_time > UNDO_COOLDOWN:
                        active_mode = "UNDO"
                        overlay.undo()
                        last_undo_time = time.time()

                elif confirmed == "CLEAR":
                    overlay.canvas[:] = 0
                    overlay.prev = None
                    overlay.history.clear()
                    active_mode = "CLEAR"

                print("RAW:", raw_static, "CONFIRMED:", confirmed)

            if raw_static != "POINTER":
                pointer_prev = None
                click_ready = True

        # ---------------- DRAWING ----------------
        if not is_locked and lm is not None:
            overlay.update(active_mode, lm)
        else:
            overlay.update(None, None)
        # print("LOCK:", is_locked, "MODE:", active_mode)  

        # pointer dot
        if active_mode == "POINTER" and lm is not None:
            px = int(lm[8].x * 1280)
            py = int(lm[8].y * 720)
            cv2.circle(frame, (px, py), 10, (255, 200, 0), 2)

        frame = overlay.blend_onto(frame)

        # ---------------- UI ----------------
        if is_locked:
            cv2.rectangle(frame, (0, 0), (1280, 50), (0, 0, 60), -1)
            cv2.putText(frame, "LOCKED - Show fist to unlock",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        else:
            cv2.rectangle(frame, (0, 0), (1280, 50), (0, 60, 0), -1)
            cv2.putText(frame, f"UNLOCKED | {active_mode or 'IDLE'}",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        if time.time() - swipe_time < 1.5:
            cv2.putText(frame, swipe_label,
                        (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 1,
                        (0, 255, 255), 2)

        cv2.imshow("Gesture Controller", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    hands.close()


if __name__ == "__main__":
    main()
