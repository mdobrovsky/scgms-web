from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import scgms_wrapper
import os

app = Flask(__name__)
CORS(app)


@app.route('/load_lib')
def load_lib():
    return scgms_wrapper.load_scgms_lib()


@app.route('/fetch_filters')
def fetch_filters():
    return scgms_wrapper.list_available_filters()


@app.route('/add_filter', methods=['POST'])
def add_filter():
    data = request.get_json()
    guid_string = data.get('guid_string', '')

    result = scgms_wrapper.add_filter(guid_string)

    return jsonify({'result': result})


@app.route('/save_configuration', methods=['POST'])
def save_configuration():
    data = request.get_json()
    file_name = data.get('file_name', '')
    config_path = "./" + file_name + ".ini"  # path to save the configuration

    # save configuration
    result = scgms_wrapper.save_configuration(config_path)

    # check if the file exists
    if result == "0" and os.path.exists(config_path):
        return send_file(config_path, as_attachment=True)  # send the file
    else:
        return jsonify({'error': 'Failed to save configuration'}), 500


if __name__ == '__main__':
    app.run()
