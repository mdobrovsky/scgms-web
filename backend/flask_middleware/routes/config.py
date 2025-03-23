from flask import Blueprint, jsonify, request, send_file
import os
from services.config_service import save_configuration_service

config_bp = Blueprint("config", __name__)

@config_bp.route("/save", methods=["POST"])
def save_configuration():
    data = request.get_json()
    print("data:", data)
    file_name = data.get("file_name", "config")
    print("file_name:", file_name)
    config_path = f"./{file_name}.ini"
    print("config_path:", config_path)

    result = save_configuration_service(config_path)

    print(result)

    if result == "0" and os.path.exists(config_path):
        return send_file(config_path, as_attachment=True)
    else:
        return jsonify({"error": "Failed to save configuration"}), 500
