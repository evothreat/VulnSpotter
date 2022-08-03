from flask import Flask

from db import setup_db

app = Flask(__name__)


@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'


if __name__ == '__main__':
    setup_db()
    app.run()
