from collections import deque
import time

class SwipeDetector:
    def __init__(self, window=12, threshold=0.18, cooldown=1.2, max_y_drift=0.10):
        self.buf = deque(maxlen=window) # Store previous 12 positions in buffer
        self.threshold = threshold
        self.cooldown = cooldown
        self.max_y_drift = max_y_drift
        self.last_fired = 0
        self.armed = True
    
    def update(self, wrist_x, wrist_y):
        now = time.time()
        self.buf.append((wrist_x, wrist_y))

        # check whether enough data are present before detecting movement
        if len(self.buf) < self.buf.maxlen:
            return None
        
        if now - self.last_fired < self.cooldown: # Prevents repeated triggering (Without this → slide moves 10 times)
            return None
        
        oldest_x, oldest_y = self.buf[0]
        newest_x, newest_y = self.buf[-1]

        dx = newest_x - oldest_x # how far hand moved horizontally
        dy = abs(newest_y - oldest_y)

        if self.armed and dx < -self.threshold: # threshold is minimum distance required to consider something a swipe.
            self.last_fired = now
            self.buf.clear()
            self.armed = False
            return "swipe_left" # Only trigger swipe if movement is greater than threshold
        
        elif self.armed and dx > self.threshold:
            self.last_fired = now
            self.buf.clear()
            self.armed = False
            return "swipe_right"
        
        else:
            # Re-arm only when hand comes back near center
            if abs(dx) < 0.03:
                self.armed = True
            return None
    
    def reset(self):
        """
        Call this whenever locking occurs.
        Clears all stored wrist positions so the return motion
        of a swipe cannot register as an opposite swipe.
        """
        self.buf.clear()
        self.last_fired = time.time()
