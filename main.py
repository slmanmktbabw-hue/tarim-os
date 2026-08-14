"""
TARIM OS V12.0 - MAIN GATEWAY
هذا الملف يحول موقع Flask الى تطبيق APK سيادي
"""
from kivy.app import App
from kivy.uix.label import Label
from kivy.clock import Clock
from kivy.utils import platform
import threading
import os

# شغل Flask في الخلفية
def start_flask():
    try:
        import app as flask_app
        flask_app.app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
    except Exception as e:
        print(f"Flask Error: {e}")

class TarimOSApp(App):
    def build(self):
        # شغل السيرفر في Thread منفصل
        t = threading.Thread(target=start_flask, daemon=True)
        t.start()

        # حاول فتح WebView اذا كان اندرويد
        if platform == 'android':
            try:
                from jnius import autoclass
                WebView = autoclass('android.webkit.WebView')
                WebViewClient = autoclass('android.webkit.WebViewClient')
                activity = autoclass('org.kivy.android.PythonActivity').mActivity
                webview = WebView(activity)
                webview.getSettings().setJavaScriptEnabled(True)
                webview.getSettings().setDomStorageEnabled(True)
                webview.getSettings().setAllowFileAccess(True)
                webview.setWebViewClient(WebViewClient())
                activity.setContentView(webview)
                webview.loadUrl('http://127.0.0.1:5001')
                return Label(text="TARIM OS V12 LOADING...")
            except Exception as e:
                return Label(text=f"TARIM OS V12.0\nhttp://127.0.0.1:5001\nError: {e}")
        else:
            # للكمبيوتر / الاختبار
            return Label(text="👑 TARIM OS V12.0 SUPREME NEXUS\nServer running at:\nhttp://127.0.0.1:5001\n\nOpen browser to view")

if __name__ == '__main__':
    TarimOSApp().run()
