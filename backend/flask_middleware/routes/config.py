from flask import Blueprint, jsonify, request, send_file
import os
from services.config_service import save_configuration_service

config_bp = Blueprint("config", __name__)

@config_bp.route("/save", methods=["POST"])
def save_configuration():
    data = request.get_json()
    file_name = data.get("file_name", "config")
    config_path = f"./{file_name}.ini"

    result = save_configuration_service(config_path)

    # print(result)

    if result == "0" and os.path.exists(config_path):
        return send_file(config_path, as_attachment=True)
    else:
        return jsonify({"error": "Failed to save configuration"}), 500
