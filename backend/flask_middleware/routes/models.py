from flask import Blueprint, jsonify
from services.model_service import get_available_models
# models_routes.py
# Defines an API endpoint for retrieving available models.
models_bp = Blueprint("models", __name__)

@models_bp.route("/fetch", methods=["GET"])
def fetch_models():
    models = get_available_models()
    return jsonify({"models": models})
