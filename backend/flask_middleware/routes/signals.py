from flask import Blueprint, jsonify
from services.signal_service import get_available_signals

signals_bp = Blueprint("signals", __name__)

@signals_bp.route("/fetch", methods=["GET"])
def fetch_signals():
    signals = get_available_signals()
    return jsonify({"signals": signals})
