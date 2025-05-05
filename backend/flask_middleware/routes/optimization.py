from flask import Blueprint, request, jsonify

from services.optimization_service import solve_service, fetch_progress_service, stop_service
# optimization_routes.py
# Provides API endpoints for starting, monitoring, and stopping the optimization process within the SmartCGMS system.

optimization_bp = Blueprint("optimization", __name__)

@optimization_bp.route("/solve", methods=["POST"])
def solve():

    data = request.get_json()
    print("Received data: ", data)
    filter_indices_str_list = data.get("filter_indices", [])
    parameter_names = data.get("parameter_names", [])
    solver_id_str = data.get("solver_id", "")
    population_size_str = data.get("population_size", 100)
    max_generations_str = data.get("max_generations", 1000)
    filter_indices = list(map(int, filter_indices_str_list))
    population_size = int(population_size_str)
    max_generations = int(max_generations_str)

    result = solve_service(filter_indices, parameter_names, solver_id_str, population_size, max_generations)
    return {"result": result}

@optimization_bp.route("/fetch_progress", methods=["GET"])
def fetch_progress():
    progress = fetch_progress_service()
    return jsonify({"progress": progress})

@optimization_bp.route("/stop", methods=["GET"])
def stop():
    result = stop_service()
    return jsonify({"result": result})