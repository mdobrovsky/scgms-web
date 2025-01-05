from flask import Flask
from flask_cors import CORS
import scgms_wrapper

app = Flask(__name__)
CORS(app)


@app.route('/fetch_filters')
def hello_world():  # put application's code here
    scgms_wrapper.load_scgms_lib()
    return scgms_wrapper.list_available_filters()
    # return "Hello World!"



if __name__ == '__main__':
    app.run()
