import cv2, time 
import numpy as np

class DrawingOverlay:
    def __init__(self, width=1280, height=720):
        self.canvas = np.zeros((height, width, 3), dtype=np.uint8) # Creates a empty canvas
        self.prev = None # Stores previous finger position to draw a line from previous → current point
        self.width = width
        self.height = height
        self.history = []
        self.is_drawing = False
        self.last_draw_time = 0
    
    def to_pixels(self, landmarks, landmark_id):
        point = landmarks[landmark_id]
        x = int(point.x * self.width)
        y = int(point.y * self.height)
        return (x, y)
    
    def update(self, mode, landmarks):
        if mode == "ERASE":
            self.canvas[:] = 0
            self.prev = None
            return
        
        if landmarks is None or mode not in ("DRAW","POINTER"):
            self.prev = None
            self.is_drawing = False
            return
        
        current_point = self.to_pixels(landmarks, 8)

        # without prev only dots and with prev smooth line
        if mode == "DRAW":

            now = time.time()

            # Detect TRUE new stroke (gap between drawing)
            if not self.is_drawing or (now - self.last_draw_time > 0.3):

                # Save ONE snapshot per stroke
                self.history.append(self.canvas.copy())

                if len(self.history) > 30:
                    self.history.pop(0)

                self.is_drawing = True

            # draw normally
            if self.prev is not None:
                cv2.line(
                    self.canvas,
                    self.prev,
                    current_point,
                    color=(0,255,180),
                    thickness=4,
                    lineType=cv2.LINE_AA
                )

            self.prev = current_point
            self.last_draw_time = now

        elif mode == "POINTER":
            self.prev = None
            self.is_drawing = False

    def blend_onto(self, frame):
        gray_canvas = cv2.cvtColor(self.canvas, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray_canvas, 1, 255, cv2.THRESH_BINARY)
        frame[mask > 0] = self.canvas[mask > 0]
        return frame
    
    def undo(self):
        if self.history:
            self.canvas = self.history.pop()
            self.prev = None
    
    def reset_line(self):
        self.prev = None
