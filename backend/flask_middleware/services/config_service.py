import scgms_wrapper

from services.filter_service import filter_info_to_dict


def save_configuration_service(config_path):
    return scgms_wrapper.save_configuration(config_path)


def load_configuration_service(config_path):
    return scgms_wrapper.load_configuration(config_path)


def get_chain_filters_service():
    filters = list(scgms_wrapper.get_chain_filters())
    return [filter_info_to_dict(f) for f in filters]
