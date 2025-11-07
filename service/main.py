import os
import sys
from pathlib import Path

from flask import Flask

if __package__ is None or __package__ == "":
    project_root = Path(__file__).resolve().parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    from service.routes.imagery_routes import imagery_bp
else:
    from .routes.imagery_routes import imagery_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(imagery_bp)
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")

