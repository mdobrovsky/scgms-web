from flask import Flask
from flask_cors import CORS

# Import each endpoint module
from routes.filters import filters_bp
from routes.signals import signals_bp
from routes.config import config_bp

app = Flask(__name__)
CORS(app)

# Blueprint registration (for each module)
app.register_blueprint(filters_bp, url_prefix="/filters")
app.register_blueprint(signals_bp, url_prefix="/signals")
app.register_blueprint(config_bp, url_prefix="/config")

if __name__ == "__main__":
    app.run(debug=True)




# from flask import Flask, request, jsonify, send_file
# from flask_cors import CORS
# import scgms_wrapper
# import os
# import os
# import json
#
# app = Flask(__name__)
# CORS(app)
#
#
# # Convert FilterParameter object to dictionary
# def filter_parameter_to_dict(param):
#     return {
#         "parameter_type": param.parameter_type,
#         "ui_parameter_name": param.ui_parameter_name,
#         "config_parameter_name": param.config_parameter_name,
#         "ui_parameter_tooltip": param.ui_parameter_tooltip,
#     }
#
#
# # Convert FilterInfo object to dictionary
# def filter_info_to_dict(filter_info):
#     return {
#         "id": filter_info.id,
#         "flags": filter_info.flags,
#         "description": filter_info.description,
#         "parameters_count": filter_info.parameters_count,
#         "parameters": [filter_parameter_to_dict(p) for p in filter_info.parameters]
#     }
#
#
# def signal_info_to_dict(signal):
#     return {
#         "fill_color": signal.fill_color,
#         "id": signal.id,
#         "mark": signal.mark,
#         "signal_description": signal.signal_description,
#         "stroke_color": signal.stroke_color,
#         "stroke_pattern": signal.stroke_pattern,
#         "unit_description": signal.unit_description,
#         "unit_id": signal.unit_id,
#         "value_scale": signal.value_scale,
#         "visualization": signal.visualization
#     }
#
#
# @app.route('/load_lib')
# def load_lib():
#     return scgms_wrapper.load_scgms_lib()
#
#
# @app.route('/fetch_signals')
# def fetch_signals():
#     signals = list(scgms_wrapper.get_available_signals())
#     signals_list = [signal_info_to_dict(s) for s in signals]
#     return jsonify({"signals": signals_list})
#
#
# @app.route('/fetch_filters')
# def fetch_filters():
#     filters = list(scgms_wrapper.get_available_filters())
#     filters_list = [filter_info_to_dict(f) for f in filters]
#     json_str = json.dumps({"filters": filters_list}, indent=2)
#     return json_str
#
#
# @app.route('/add_filter', methods=['POST'])
# def add_filter():
#     data = request.get_json()
#     guid_string = data.get('guid_string', '')
#
#     result = scgms_wrapper.add_filter(guid_string)
#
#     return jsonify({'result': result})
#
#
# @app.route('/save_configuration', methods=['POST'])
# def save_configuration():
#     data = request.get_json()
#     file_name = data.get('file_name', '')
#     config_path = "./" + file_name + ".ini"  # path to save the configuration
#
#     # save configuration
#     result = scgms_wrapper.save_configuration(config_path)
#
#     # check if the file exists
#     if result == "0" and os.path.exists(config_path):
#         return send_file(config_path, as_attachment=True)  # send the file
#     else:
#         return jsonify({'error': 'Failed to save configuration'}), 500
#
#
# @app.route('/remove_filter', methods=['POST'])
# def remove_filter():
#     data = request.get_json()
#     index = data.get('index', '')
#     print("removing filter at index: ", index)
#
#     result = scgms_wrapper.remove_filter(index)
#
#     print("result: ", result)
#
#     return jsonify({'result': result})
#
#
# if __name__ == '__main__':
#     app.run()
