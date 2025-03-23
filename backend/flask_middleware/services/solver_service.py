import scgms_wrapper

# Convert FilterParameter object to dictionary
def solvers_info_to_dict(solver):
    return {
        "id": solver.id,
        "description": solver.description,
        "specialized": solver.specialized,
        "specialized_count": solver.specialized_count,
        "specialized_models": [str(p) for p in solver.specialized_models],
    }

def get_available_solvers():
    solvers = list(scgms_wrapper.get_available_solvers())
    solvers_dict = [solvers_info_to_dict(s) for s in solvers]
    return solvers_dict
