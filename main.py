"""
TARIM OS V12.0 - MAIN GATEWAY
يحول Flask الى APK
"""
from kivy.app import App
from kivy.uix.label import Label
import threading

def start_flask():
    try:
        import app as flask_app
        flask_app.app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
    except Exception as e:
        print(f"Flask Error: {e}")

class TarimOSApp(App):
    def build(self):
        t = threading.Thread(target=start_flask, daemon=True)
        t.start()
        return Label(text="👑 TARIM OS V12.0\nServer: http://127.0.0.1:5001\nLoading Imperial Nexus...")

if __name__ == '__main__':
    TarimOSApp().run()
