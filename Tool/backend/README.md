# Flask Server Installation and Setup Guide

This guide will walk you through the process of installing the necessary requirements and starting a Flask server on your local machine. Flask is a popular Python web framework used for building web applications.

## Prerequisites

Before proceeding, ensure that you have the following installed on your machine:

- Python 3: Flask requires Python 3.5 or higher. You can download Python from the official website: https://www.python.org/downloads/
- pip: The package installer for Python. It should be installed along with Python.

## Installation

Follow the steps below to install the required dependencies:

1. Clone the repository or download the project files to your local machine.
2. Open a terminal or command prompt and navigate to the project directory.

   ```bash
   cd /path/to/project
   ```

3. Create a virtual environment (optional but recommended). It helps to keep your project dependencies isolated.

   ```bash
   python3 -m venv venv
   ```

4. Activate the virtual environment. This step may vary depending on your operating system.

   - **Windows**:

     ```bash
     venv\Scripts\activate
     ```

   - **Mac/Linux**:

     ```bash
     source venv/bin/activate
     ```

5. Install the required Python packages using pip and the provided `requirements.txt` file.

   ```bash
   pip install -r requirements.txt
   ```

   This will install Flask and any other necessary dependencies.

## Configuration

If your Flask application requires any configuration, you can modify the `config.py` file in the project directory with the following settings:

```python
# config.py

DB_PATH = r'test_data\data.db'

JWT_SECRET_KEY = 'super_secret_key'

JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day
JWT_REFRESH_TOKEN_EXPIRES = 60 * 60 * 24 * 30  # 1 month

REPOS_DIR = r'test_data\repos'

EXPORTS_DIR = r'test_data\exports'
EXPORT_LIFETIME = 60 * 2
```

Make sure to update the paths and keys according to your requirements.

## Starting the Flask Server

Once the installation is complete and the necessary configurations have been made, you can start the Flask server by following these steps:

1. Ensure that you are still in the project directory and your virtual environment is activated.

2. Set the Flask application environment variable.

   - **Windows**:

     ```bash
     set FLASK_APP=app.py
     ```

   - **Mac/Linux**:

     ```bash
     export FLASK_APP=app.py
     ```

3. (Optional) Set the Flask environment mode. By default, Flask runs in development mode, but you can change it to production or any other custom mode.

   - **Windows**:

     ```bash
     set FLASK_ENV=development
     ```

   - **Mac/Linux**:

     ```bash
     export FLASK_ENV=development
     ```

4. Start the Flask server.

   ```bash
   flask run
   ```

   This command will start the server on `http://127.0.0.1:5000/` (localhost) by default.

Congratulations! You have successfully installed the necessary requirements, configured the Flask server, and started it. You can now access your Flask application by opening a web browser and navigating to the provided URL.

Remember to keep the terminal or command prompt open while the server is running. You can stop the server at any time by pressing `Ctrl + C` in the terminal.

Enjoy developing your Flask application