from app import app

def handler(request):
    return app(request)

if __name__ == '__main__':
    app.run()