from app.database.db import get_db
from app.database.models import Room, DrawingEvent
from app.services.user_service import UserService


class RoomService:
    @staticmethod
    def get_rooms():
        with get_db() as db:
            rooms = db.query(Room).order_by(Room.created_at.asc()).all()

            return [
                {
                    "id": str(room.id),
                    "name": room.name,
                    "participantCount": UserService.get_participant_count(str(room.id)),
                    "createdAt": room.created_at.isoformat() if room.created_at else None,
                }
                for room in rooms
            ]

    @staticmethod
    def create_room(name: str):
        with get_db() as db:
            room = Room(name=name)
            db.add(room)
            db.commit()
            db.refresh(room)

            return {
                "id": str(room.id),
                "name": room.name,
                "participantCount": 0,
                "createdAt": room.created_at.isoformat() if room.created_at else None,
            }

    @staticmethod
    def ensure_default_room():
        with get_db() as db:
            existing = db.query(Room).filter(Room.name == "Main Whiteboard").first()
            if existing:
                return existing

            room = Room(name="Main Whiteboard")
            db.add(room)
            db.commit()
            db.refresh(room)
            return room

    @staticmethod
    def get_room(room_id: str):
        with get_db() as db:
            room = db.query(Room).filter(Room.id == int(room_id)).first()

            if not room:
                return None

            return {
                "id": str(room.id),
                "name": room.name,
                "participantCount": UserService.get_participant_count(str(room.id)),
                "createdAt": room.created_at.isoformat() if room.created_at else None,
            }

    @staticmethod
    def delete_room(room_id: str):
        with get_db() as db:
            room = db.query(Room).filter(Room.id == int(room_id)).first()

            if not room:
                return False

            # Delete related drawing events first
            db.query(DrawingEvent).filter(
                DrawingEvent.room_id == int(room_id)
            ).delete(synchronize_session=False)

            # Remove active users from in-memory presence
            room_id_str = str(room_id)
            if room_id_str in UserService._active_users_by_room:
                del UserService._active_users_by_room[room_id_str]

            # Delete room
            db.delete(room)
            db.commit()

            return True