import scgms_wrapper

from services.filter_service import filter_info_to_dict

def init_service():
    scgms_wrapper.init_config()
    return "0"

def svg_info_to_dict(svg):
    return {
        "id": svg.id,
        "name": svg.name,
        "svg_str": svg.svg_str,
    }


def save_configuration_service(config_path):
    return scgms_wrapper.save_configuration(config_path)


def load_configuration_service(config_path):
    return scgms_wrapper.load_configuration(config_path)


def get_chain_filters_service():
    filters = list(scgms_wrapper.get_chain_filters())
    return [filter_info_to_dict(f) for f in filters]

def get_svgs_service():
    svgs = list(scgms_wrapper.get_svgs())
    return [svg_info_to_dict(svg) for svg in svgs]

def execute_service():
    return scgms_wrapper.execute()
