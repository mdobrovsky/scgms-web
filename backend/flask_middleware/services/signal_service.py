import scgms_wrapper
# signal_service.py
# Provides functionality to retrieve and convert available signal metadata from the SmartCGMS system.

# Convert FilterParameter object to dictionary
def signal_info_to_dict(signal):
    return {
        "fill_color": signal.fill_color,
        "id": signal.id,
        "mark": signal.mark,
        "signal_description": signal.signal_description,
        "stroke_color": signal.stroke_color,
        "stroke_pattern": signal.stroke_pattern,
        "unit_description": signal.unit_description,
        "unit_id": signal.unit_id,
        "value_scale": signal.value_scale,
        "visualization": signal.visualization,
    }

def get_available_signals():
    signals = list(scgms_wrapper.get_available_signals())
    return [signal_info_to_dict(s) for s in signals]
