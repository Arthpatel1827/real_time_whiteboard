import argparse
import json
import random
import threading
import time

import requests


def send_event(api_url, room_id, user_id):
    event = {
        'roomId': room_id,
        'userId': user_id,
        'eventType': 'stroke',
        'coordinates': {
            'start': {'x': random.randint(0, 800), 'y': random.randint(0, 600)},
            'end': {'x': random.randint(0, 800), 'y': random.randint(0, 600)},
        },
        'color': '#000000',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
    }

    mutation = '''
    mutation SendDrawingEvent($input: DrawingEventInput!) {
      sendDrawingEvent(input: $input)
    }
    '''

    response = requests.post(api_url, json={'query': mutation, 'variables': {'input': event}})
    return response.json()


def worker(api_url, room_id, user_id, interval_seconds):
    while True:
        send_event(api_url, room_id, user_id)
        time.sleep(interval_seconds)


def main():
    parser = argparse.ArgumentParser(description='Simulate users sending drawing events.')
    parser.add_argument('--api-url', default='http://localhost:5000/graphql/')
    parser.add_argument('--room-id', default='1')
    parser.add_argument('--users', type=int, default=5)
    parser.add_argument('--interval', type=float, default=0.5)
    args = parser.parse_args()

    threads = []
    for i in range(args.users):
        user_id = str(i + 1)
        thread = threading.Thread(
            target=worker, args=(args.api_url, args.room_id, user_id, args.interval), daemon=True
        )
        thread.start()
        threads.append(thread)

    print(f'Simulating {args.users} users sending events every {args.interval}s...')
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print('Stopping simulation.')


if __name__ == '__main__':
    main()
