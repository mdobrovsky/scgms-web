from flask import Blueprint

from services.library_service import load_scgms_lib_service

library_bp = Blueprint("library", __name__)

@library_bp.route("/load", methods=["GET"])
def load_library():
    """
    Load the SCGMS library service
    """
    result = load_scgms_lib_service()
    return {"result": result}