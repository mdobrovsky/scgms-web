import scgms_wrapper

# Convert FilterParameter object to dictionary
def filter_parameter_to_dict(param):
    return {
        "parameter_type": param.parameter_type,
        "ui_parameter_name": param.ui_parameter_name,
        "config_parameter_name": param.config_parameter_name,
        "ui_parameter_tooltip": param.ui_parameter_tooltip,
    }

# Convert FilterInfo object to dictionary
def filter_info_to_dict(filter_info):
    return {
        "id": filter_info.id,
        "flags": filter_info.flags,
        "description": filter_info.description,
        "parameters_count": filter_info.parameters_count,
        "parameters": [filter_parameter_to_dict(p) for p in filter_info.parameters],
    }

def get_available_filters():
    filters = list(scgms_wrapper.get_available_filters())
    return [filter_info_to_dict(f) for f in filters]

def add_filter_service(guid_string):
    return scgms_wrapper.add_filter(guid_string)

def remove_filter_service(index):
    return scgms_wrapper.remove_filter(index)
