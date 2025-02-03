from flask import Flask
from flask_cors import CORS
import scgms_wrapper

app = Flask(__name__)
CORS(app)


@app.route('/load_lib')
def load_lib():
    return scgms_wrapper.load_scgms_lib()


@app.route('/fetch_filters')
def fetch_filters():
    return scgms_wrapper.list_available_filters()



if __name__ == '__main__':
    app.run()
