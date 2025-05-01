import scgms_wrapper

def solver_progress_info_to_dict(solver_progress):
    return {
        "current_progress": solver_progress.current_progress,
        "max_progress": solver_progress.max_progress,
        "best_metric": solver_progress.best_metric,
        "status": solver_progress.status,
    }

def solve_service(filter_indices, parameter_names, solver_id_str, population_size, max_generations):
    return scgms_wrapper.optimize_parameters(filter_indices, parameter_names, solver_id_str, population_size,
                                             max_generations)


def fetch_progress_service():
    return solver_progress_info_to_dict(scgms_wrapper.get_solver_progress_info())


def stop_service():
    return scgms_wrapper.stop_optimization()
