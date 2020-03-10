from flask import Flask, send_from_directory
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager
from flask.ext.mail import Mail
from notejam.config import (
    Config,
    DevelopmentConfig,
    ProductionConfig,
    TestingConfig)
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

from_env = {'production': ProductionConfig,
            'development': DevelopmentConfig,
            'testing': TestingConfig,
            'dbconfig': Config}

# @TODO use application factory approach
app = Flask(__name__, static_url_path='/flask/static', static_folder='static')
app.config.from_object(from_env[os.environ.get('ENVIRONMENT', 'testing')])
if os.environ.get('ENVIRONMENT') == 'production':
    import sqlalchemy
    engine = sqlalchemy.create_engine(ProductionConfig.ROOT_DATABASE_URI)
    engine.execute("CREATE SCHEMA IF NOT EXISTS %s;" % os.environ.get('DATABASE_SCHEMA'))
    engine.execute("USE master;")
db = SQLAlchemy(app)
service = 'notejam-flask-' + os.environ.get('ENVIRONMENT', 'testing')
xray_recorder.configure(service=service)
XRayMiddleware(app, xray_recorder)


@app.before_first_request
def create_tables():
    db.create_all()


@app.route('/health')
def return_ok():
    return '', 200


login_manager = LoginManager()
login_manager.login_view = "signin"
login_manager.init_app(app)

mail = Mail()
mail.init_app(app)

from notejam import views
