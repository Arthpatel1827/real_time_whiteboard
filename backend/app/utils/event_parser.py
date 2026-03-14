import json


def parse_event_message(raw: str) -> dict:
    try:
        return json.loads(raw)
    except Exception:
        return {}
