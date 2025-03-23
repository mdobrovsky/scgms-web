from flask import Blueprint, jsonify, request
import scgms_wrapper
from services.filter_service import get_available_filters, add_filter_service, remove_filter_service, \
    configure_filter_service, move_up_service, move_down_service

filters_bp = Blueprint("filters", __name__)


@filters_bp.route("/fetch", methods=["GET"])
def fetch_filters():
    filters = get_available_filters()
    return jsonify({"filters": filters})


@filters_bp.route("/add", methods=["POST"])
def add_filter():
    data = request.get_json()
    guid_string = data.get("guid_string", "")
    result = add_filter_service(guid_string)
    return jsonify({"result": result})


@filters_bp.route("/remove", methods=["POST"])
def remove_filter():
    data = request.get_json()
    index = data.get("index", 0)
    print("removing filter at index: ", index)
    result = remove_filter_service(index)
    return jsonify({"result": result})


@filters_bp.route("/move_up", methods=["POST"])
def move_filter_up():
    data = request.get_json()
    index = data.get("index", 0)
    print("moving filter up at index: ", index)
    result = move_up_service(index)
    return jsonify({"result": result})


@filters_bp.route("/move_down", methods=["POST"])
def move_filter_down():
    data = request.get_json()
    index = data.get("index", 0)
    print("moving filter down at index: ", index)
    result = move_down_service(index)
    return jsonify({"result": result})


@filters_bp.route("/configure", methods=["POST"])
def configure_filter():
    data = request.get_json()
    filter = data["filter"]
    parameters = filter["parameters"]
    print("configuring filter: ", filter)
    result = configure_filter_service(filter, parameters)
    return jsonify({"result": result})
