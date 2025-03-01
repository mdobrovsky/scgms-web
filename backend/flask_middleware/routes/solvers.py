from flask import Blueprint, jsonify
from services.solver_service import get_available_solvers

solvers_bp = Blueprint("solvers", __name__)

@solvers_bp.route("/fetch", methods=["GET"])
def fetch_solvers():
    solvers = get_available_solvers()
    return jsonify({"solvers": solvers})
