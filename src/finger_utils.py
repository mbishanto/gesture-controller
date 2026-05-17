# # Detects how many fingers are up
# # Each finger has: TIP (top), PIP (middle joint)
# # tip is ABOVE pip → finger is UP

FINGERTIPS = [8, 12, 16, 20]
PIP_JOINTS = [6, 10, 14, 18]
THUMB_TIP = 4
THUMB_IP  = 3

def count_fingers(landmarks, handedness):
    count = 0

    # Thumb
    thumb_tip = landmarks[THUMB_TIP]
    thumb_ip  = landmarks[THUMB_IP]

    # Other fingers
    for tip_id, pip_id in zip(FINGERTIPS, PIP_JOINTS):
        if landmarks[tip_id].y < landmarks[pip_id].y:
            count += 1

    return count


def is_fist(landmarks, handedness):
    # All fingers must be DOWN
    for tip_id, pip_id in zip(FINGERTIPS, PIP_JOINTS):
        if landmarks[tip_id].y < landmarks[pip_id].y - 0.04:
            return False

    # Thumb must also be closed
    thumb_tip = landmarks[THUMB_TIP]
    thumb_ip = landmarks[THUMB_IP]

    if abs(thumb_tip.x - thumb_ip.x) > 0.05:
        return False
    return True


def get_static_gesture(n_fingers):
    mapping = {
        # 0: "FIST",
        1: "DRAW",
        2: "POINTER",
        3: "UNDO",
        4: "CLEAR",
    }
    return mapping.get(n_fingers, None)
