import os
import time

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.exc import OperationalError

from app.database.db import init_db, is_db_ready
from app.kafka.kafka_consumer import start_consumer
from app.observability.logging_config import configure_logging
from app.routes.auth_routes import auth_bp
from app.services.room_service import RoomService


def wait_for_database(app, max_attempts=20, delay_seconds=2):
    last_error = None

    for attempt in range(1, max_attempts + 1):
        try:
            init_db(app)
            if is_db_ready():
                print(f"Database is ready on attempt {attempt}.")
                return
        except OperationalError as exc:
            last_error = exc
        except Exception as exc:
            last_error = exc

        print(
            f"Database not ready yet (attempt {attempt}/{max_attempts}), "
            f"retrying in {delay_seconds}s..."
        )
        time.sleep(delay_seconds)

    raise last_error


def create_app():
    app = Flask(__name__)

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("JWT_SECRET", "supersecret"),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL",
            "postgresql+psycopg2://whiteboard:whiteboard@localhost:5432/whiteboard",
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    configure_logging(app)

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=False,
    )

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok"})

    app.register_blueprint(auth_bp)

    wait_for_database(app)
    RoomService.ensure_default_room()
    start_consumer()

    return app
