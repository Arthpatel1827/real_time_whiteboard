# Placeholder for GraphQL mutation resolvers related to drawing events.

from app.services.drawing_service import DrawingService


def send_drawing_event_resolver(_, info, input):
    event = DrawingService.create_drawing_event(**input)
    DrawingService.publish_event(event)
    return True
