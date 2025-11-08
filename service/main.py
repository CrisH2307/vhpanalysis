import os
import sys
from pathlib import Path
from uuid import uuid4

from flask import Flask, session
from flask_cors import CORS

if __package__ is None or __package__ == "":
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    from service.routes.imagery_routes import imagery_bp
    from service.imagery.session_store import InMemorySessionDataStore, set_session_data_store
    from service.routes.simulate_routes import simulate_bp
    from service.routes.score_routes import score_bp
else:
    from .routes.imagery_routes import imagery_bp
    from .imagery.session_store import InMemorySessionDataStore, set_session_data_store
    from .routes.score_routes import score_bp
    from .routes.simulate_routes import simulate_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret")

    # Enable CORS for all routes
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    session_store = InMemorySessionDataStore()
    set_session_data_store(session_store)
    app.extensions["session_data_store"] = session_store

    app.register_blueprint(imagery_bp)
    app.register_blueprint(simulate_bp)
    app.register_blueprint(score_bp)

    @app.before_request
    def ensure_session_id() -> None:
        if "session_id" not in session:
            session["session_id"] = str(uuid4())

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")

