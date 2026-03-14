def validate_drawing_event(event: dict) -> bool:
    # Basic validation; extend with schema checks.
    required = ['roomId', 'userId', 'eventType', 'coordinates']
    return all(k in event for k in required)
