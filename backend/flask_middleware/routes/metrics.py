from flask import Blueprint, jsonify
from services.metric_service import get_available_metrics

metrics_bp = Blueprint("metrics", __name__)

@metrics_bp.route("/fetch", methods=["GET"])
def fetch_metrics():
    metrics = get_available_metrics()
    return jsonify({"metrics": metrics})
