from notejam import app
import os


if __name__ == '__main__':
    if os.environ.get('ENVIRONMENT') == 'production':
        # Broadcast to network on prod
        app.run(host='0.0.0.0')
    else:
        # Only loopback on dev
        app.run()
