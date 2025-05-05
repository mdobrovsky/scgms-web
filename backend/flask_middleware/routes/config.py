from flask import Blueprint, jsonify, request, send_file
import os
from services.config_service import save_configuration_service, load_configuration_service, get_chain_filters_service, \
    get_svgs_service, execute_service, init_service, stop_service, get_logs_service

CONFIG_DIRECTORY = "./configurations"
SAVED_CONFIGS_DIRECTORY = CONFIG_DIRECTORY + "/saved"
LOADED_CONFIGS_DIRECTORY = CONFIG_DIRECTORY + "/loaded"


config_bp = Blueprint("config", __name__)

@config_bp.route("/init", methods=["GET"])
def init_config():
    result = init_service()
    return jsonify({"result": result})


@config_bp.route("/save", methods=["POST"])
def save_configuration():
    data = request.get_json()
    # print("data:", data)
    file_name = data.get("file_name", "config")
    # print("file_name:", file_name)
    config_path = f"{SAVED_CONFIGS_DIRECTORY}/{file_name}.ini"
    # print("config_path:", config_path)
    os.makedirs(os.path.dirname(config_path), exist_ok=True)

    result = save_configuration_service(config_path)

    print(result)

    if result == "0" and os.path.exists(config_path):
        return send_file(config_path, as_attachment=True)
    else:
        return jsonify({"error": "Failed to save configuration"}), 500


@config_bp.route("/load", methods=["POST"])
def load_configuration():
    # print(request.form)
    uploaded_file = request.files.get("file")
    file_name = request.form.get("file_name", "file")
    if not uploaded_file:
        return jsonify({"error": "No file uploaded"}), 400
    save_path = f"{LOADED_CONFIGS_DIRECTORY}/{file_name}"
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    uploaded_file.save(save_path)
    # print(uploaded_file)
    csv_files = []
    i = 0
    while True:
        key = f'csv_files[{i}]'
        if key in request.files:
            csv_file = request.files[key]
            csv_files.append(csv_file)
            i += 1
        else:
            break
    for csv_file in csv_files:
        csv_file_name = csv_file.filename
        csv_file_path = os.path.join(LOADED_CONFIGS_DIRECTORY, csv_file_name)
        csv_file.save(csv_file_path)

    result = load_configuration_service(save_path)
    # result = "0"
    print("result: ", result)
    return jsonify(result)

@config_bp.route("/fetch_filters", methods=["GET"])
def get_chain_filters():
    filters = get_chain_filters_service()
    return jsonify({"filters": filters})

@config_bp.route("/fetch_svgs", methods=["GET"])
def get_svgs():
    svgs = get_svgs_service()
    return jsonify({"svgs": svgs})

@config_bp.route("/fetch_logs", methods=["GET"])
def get_logs():
    logs = get_logs_service()
    # print(f"logs: {logs}")
    return jsonify({"logs": logs})

@config_bp.route("/execute", methods=["GET"])
def execute():
    filters = get_chain_filters_service()
    print(filters)
    # check if there is replay log filter and if its csv is imported
    for f in filters:
        if f["description"] == "CSV File Log Replay":
            for p in f["parameters"]:
                if p["config_parameter_name"] == "Log_File":
                    csv_file = p["value"]
                    if not os.path.exists(csv_file):
                        print(f"CSV file {csv_file} not found")
                        return jsonify({"result": f"CSV file {csv_file} not found"})

    result = execute_service()
    return jsonify({"result": result})

@config_bp.route("/import_csv", methods=["POST"])
def import_csv_files():
    # print(request.form)
    csv_files = []
    i = 0
    while True:
        key = f'csv_files[{i}]'
        print("key: ", key)
        if key in request.files:
            print("request.files[key]: ", request.files[key])
            csv_file = request.files[key]
            csv_files.append(csv_file)
            i += 1
        else:
            break
    for csv_file in csv_files:
        print("csv_file: ", csv_file)
        csv_file_name = csv_file.filename
        data = csv_file.read()

        with open(os.path.join("./", csv_file_name), "wb") as f:
            f.write(data)

        with open(os.path.join(LOADED_CONFIGS_DIRECTORY, csv_file_name), "wb") as f:
            f.write(data)

    return jsonify({"result": "0"})


@config_bp.route("/stop", methods=["GET"])
def stop():
    result = stop_service()
    return jsonify({"result": result})