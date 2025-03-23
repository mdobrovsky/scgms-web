import scgms_wrapper

# Convert FilterParameter object to dictionary
def models_info_to_dict(model):
    return {
        "id": model.id,
        "flags": model.flags,
        "description": model.description,
        "db_table_name": model.db_table_name,
        "number_of_parameters": model.number_of_parameters,
        "number_of_segment_specific_parameters": model.number_of_segment_specific_parameters,
        "parameter_types": [str(p) for p in model.parameter_types],
        "parameter_ui_names": [str(p) for p in model.parameter_ui_names],
        "parameter_db_column_names": [str(p) for p in model.parameter_db_column_names],
        "lower_bound": model.lower_bound,
        "default_values": [str(p) for p in model.default_values],
        "upper_bound": model.upper_bound,
        "number_of_calculated_signals": model.number_of_calculated_signals,
        "calculated_signal_ids": [str(p) for p in model.calculated_signal_ids],
        "reference_signal_ids": [str(p) for p in model.reference_signal_ids],

    }

def get_available_models():
    models = list(scgms_wrapper.get_available_models())
    models_dict = [models_info_to_dict(s) for s in models]
    return models_dict
