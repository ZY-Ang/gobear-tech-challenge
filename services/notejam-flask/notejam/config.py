import os


class Config(object):
    DEBUG = False
    TESTING = False
    SECRET_KEY = 'notejam-flask-secret-key'
    CSRF_ENABLED = True
    CSRF_SESSION_KEY = 'notejam-flask-secret-key'


class ProductionConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "mysql://%s:%s@%s/%s" % (
        os.environ.get('DATABASE_USERNAME'),
        os.environ.get('DATABASE_PASSWORD'),
        os.environ.get('DATABASE_ENDPOINT'),
        os.environ.get('DATABASE_SCHEMA')
    )
    ROOT_DATABASE_URI = "mysql://%s:%s@%s" % (
        os.environ.get('DATABASE_USERNAME'),
        os.environ.get('DATABASE_PASSWORD'),
        os.environ.get('DATABASE_ENDPOINT')
    )


class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.getcwd(),
                                                          'notejam.db')


class TestingConfig(Config):
    TESTING = True
    """
    Tests will run WAY faster using in memory SQLITE database
    See: https://docs.sqlalchemy.org/en/13/dialects/sqlite.html#connect-strings
    """
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
