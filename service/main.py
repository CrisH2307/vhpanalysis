import os
import sys
from pathlib import Path
from uuid import uuid4

from flask import Flask, session

if __package__ is None or __package__ == "":
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    from service.routes.imagery_routes import imagery_bp
    from service.imagery.session_store import InMemorySessionDataStore, set_session_data_store
else:
    from .routes.imagery_routes import imagery_bp
    from .imagery.session_store import InMemorySessionDataStore, set_session_data_store


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret")

    session_store = InMemorySessionDataStore()
    set_session_data_store(session_store)
    app.extensions["session_data_store"] = session_store

    app.register_blueprint(imagery_bp)

    @app.before_request
    def ensure_session_id() -> None:
        if "session_id" not in session:
            session["session_id"] = str(uuid4())

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")

