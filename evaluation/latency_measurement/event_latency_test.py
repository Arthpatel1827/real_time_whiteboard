import time

import requests


def measure_latency(api_url: str, room_id: str, user_id: str, iterations: int = 10):
    mutation = '''
    mutation SendDrawingEvent($input: DrawingEventInput!) {
      sendDrawingEvent(input: $input)
    }
    '''

    latencies = []
    for i in range(iterations):
        event = {
            'roomId': room_id,
            'userId': user_id,
            'eventType': 'stroke',
            'coordinates': {'start': {'x': 10, 'y': 10}, 'end': {'x': 20, 'y': 20}},
            'color': '#000000',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.%fZ', time.gmtime()),
        }

        start = time.time()
        requests.post(api_url, json={'query': mutation, 'variables': {'input': event}})
        latencies.append(time.time() - start)

    return latencies


if __name__ == '__main__':
    url = 'http://localhost:5000/graphql/'
    results = measure_latency(url, '1', '1', iterations=20)
    print('Latency samples (s):', results)
    print('Average latency (s):', sum(results) / len(results))
