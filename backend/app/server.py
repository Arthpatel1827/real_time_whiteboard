import os

from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.wsgi import WSGIMiddleware
from starlette.responses import RedirectResponse
from starlette.routing import Mount, Route

from app.create_app import create_app
from app.graphql.schema import graphql_app

load_dotenv()

try:
    from uvicorn import run
except ImportError:
    run = None


def graphql_redirect(request):
    return RedirectResponse(url="/graphql/", status_code=307)


flask_app = create_app()

asgi_app = Starlette(
    routes=[
        Route("/graphql", endpoint=graphql_redirect, methods=["GET", "POST", "OPTIONS"]),
        Mount("/graphql/", graphql_app),
        Mount("/", WSGIMiddleware(flask_app)),
    ],
)

asgi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

if __name__ == "__main__":
    if run is None:
        raise RuntimeError("uvicorn is required")

    port = int(os.environ.get("PORT", 5000))
    run("app.server:asgi_app", host="0.0.0.0", port=port, log_level="info")