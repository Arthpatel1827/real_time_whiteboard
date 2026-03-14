import random
import uuid


def generate_event(room_id: str, user_id: str):
    # Simple random line segment
    return {
        'roomId': room_id,
        'userId': user_id,
        'eventType': 'stroke',
        'coordinates': {
            'start': {'x': random.randint(0, 800), 'y': random.randint(0, 600)},
            'end': {'x': random.randint(0, 800), 'y': random.randint(0, 600)},
        },
        'color': random.choice(['#000000', '#ff0000', '#00ff00', '#0000ff']),
        'timestamp': None,
    }


if __name__ == '__main__':
    print(generate_event(str(uuid.uuid4()), str(uuid.uuid4())))
