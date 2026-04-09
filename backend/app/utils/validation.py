def validate_room_id(room_id):
    if room_id is None:
        raise ValueError("roomId is required")

    try:
        value = int(room_id)
    except (TypeError, ValueError):
        raise ValueError("roomId must be a valid integer")

    if value <= 0:
        raise ValueError("roomId must be greater than 0")

    return value


def validate_coordinates(event_type: str, coordinates: dict):
    if not isinstance(coordinates, dict):
        raise ValueError("coordinates must be an object")

    if event_type == "clear":
        return True

    if event_type == "pencil":
        points = coordinates.get("points")
        if not isinstance(points, list) or len(points) < 2:
            raise ValueError("pencil event requires at least 2 points")

        for point in points:
            if not isinstance(point, dict):
                raise ValueError("each point must be an object")

            if "x" not in point or "y" not in point:
                raise ValueError("each point must contain x and y")

            if not isinstance(point["x"], (int, float)) or not isinstance(point["y"], (int, float)):
                raise ValueError("point coordinates must be numeric")

        return True

    if event_type in {"rectangle", "circle"}:
        start = coordinates.get("start")
        end = coordinates.get("end")

        if not isinstance(start, dict) or not isinstance(end, dict):
            raise ValueError(f"{event_type} event requires start and end")

        for point in (start, end):
            if "x" not in point or "y" not in point:
                raise ValueError(f"{event_type} coordinates must contain x and y")

            if not isinstance(point["x"], (int, float)) or not isinstance(point["y"], (int, float)):
                raise ValueError(f"{event_type} coordinates must be numeric")

        return True

    raise ValueError(f"Unsupported eventType: {event_type}")


def validate_cursor_coordinates(x, y):
    if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
        raise ValueError("cursor coordinates must be numeric")