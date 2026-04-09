import threading
import time
from collections import defaultdict


class MetricsStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._started_at = time.time()
        self._counters = defaultdict(int)
        self._gauges = {}
        self._timings = defaultdict(list)

    def inc(self, key: str, amount: int = 1):
        with self._lock:
            self._counters[key] += amount

    def set_gauge(self, key: str, value):
        with self._lock:
            self._gauges[key] = value

    def timing(self, key: str, value_ms: float):
        with self._lock:
            bucket = self._timings[key]
            bucket.append(value_ms)
            if len(bucket) > 200:
                del bucket[: len(bucket) - 200]

    def snapshot(self):
        with self._lock:
            return {
                "uptimeSeconds": round(time.time() - self._started_at, 2),
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
                "timingsMs": {
                    key: {
                        "count": len(values),
                        "avg": round(sum(values) / len(values), 2) if values else 0,
                        "max": round(max(values), 2) if values else 0,
                    }
                    for key, values in self._timings.items()
                },
            }


metrics_store = MetricsStore()