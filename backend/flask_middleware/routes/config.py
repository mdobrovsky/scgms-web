from flask import Blueprint, jsonify, request, send_file
import os
from services.config_service import save_configuration_service

CONFIG_DIRECTORY = "./configurations"
SAVED_CONFIGS_DIRECTORY = CONFIG_DIRECTORY + "/saved"
LOADED_CONFIGS_DIRECTORY = CONFIG_DIRECTORY + "/loaded"


config_bp = Blueprint("config", __name__)


@config_bp.route("/save", methods=["POST"])
def save_configuration():
    data = request.get_json()
    # print("data:", data)
    file_name = data.get("file_name", "config")
    # print("file_name:", file_name)
    config_path = f"{SAVED_CONFIGS_DIRECTORY}/{file_name}.ini"
    # print("config_path:", config_path)

    result = save_configuration_service(config_path)

    print(result)

    if result == "0" and os.path.exists(config_path):
        return send_file(config_path, as_attachment=True)
    else:
        return jsonify({"error": "Failed to save configuration"}), 500


@config_bp.route("/load", methods=["POST"])
def load_configuration():
    uploaded_file = request.files.get("file")
    file_name = request.form.get("file_name", "file")
    if not uploaded_file:
        return jsonify({"error": "No file uploaded"}), 400
    save_path = f"{LOADED_CONFIGS_DIRECTORY}/{file_name}"
    uploaded_file.save(save_path)
    print(uploaded_file)
    # Volání tvé služby pro zpracování
    # result = save_configuration_service(save_path)
    result = "0"
    if result == "0":
        return jsonify({"message": "File saved and processed successfully"})
    else:
        return jsonify({"error": "Processing failed"}), 500
