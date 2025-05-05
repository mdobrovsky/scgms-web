import scgms_wrapper

# metric_service.py
# Provides functionality for retrieving available metrics from the SmartCGMS backend via scgms_wrapper.


# Convert FilterParameter object to dictionary
def metrics_info_to_dict(metric):
    return {
        "id": metric.id,
        "description": metric.description,
    }

def get_available_metrics():
    metrics = list(scgms_wrapper.get_available_metrics())
    metrics_dict = [metrics_info_to_dict(s) for s in metrics]
    return metrics_dict