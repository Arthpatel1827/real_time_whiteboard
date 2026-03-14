# Placeholder for GraphQL query resolvers related to board history.

from app.services.drawing_service import DrawingService


def get_board_history_resolver(_, info, roomId):
    return DrawingService.get_history(room_id=roomId)
