from flask import Flask
from flask_cors import CORS

# Import each endpoint module
from routes.filters import filters_bp
from routes.signals import signals_bp
from routes.config import config_bp
from routes.models import models_bp
from routes.solvers import solvers_bp

app = Flask(__name__)
CORS(app)

# Blueprint registration (for each module)
app.register_blueprint(filters_bp, url_prefix="/filters")
app.register_blueprint(signals_bp, url_prefix="/signals")
app.register_blueprint(models_bp, url_prefix="/models")
app.register_blueprint(config_bp, url_prefix="/config")
app.register_blueprint(solvers_bp, url_prefix="/solvers")

if __name__ == "__main__":
    app.run(debug=True)

