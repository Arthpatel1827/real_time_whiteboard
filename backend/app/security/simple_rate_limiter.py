import threading
import time


class SlidingWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._events = {}

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()

        with self._lock:
            timestamps = self._events.get(key, [])
            timestamps = [ts for ts in timestamps if now - ts < window_seconds]

            if len(timestamps) >= limit:
                self._events[key] = timestamps
                return False

            timestamps.append(now)
            self._events[key] = timestamps
            return True


rate_limiter = SlidingWindowRateLimiter()