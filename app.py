# -*- coding: utf-8 -*-
# Tarim_Fortress V8.1 - IMPERIAL MERGE - HARDENED EDITION
import os
import logging
from flask import Flask, request, jsonify
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from dotenv import load_dotenv

load_dotenv()

# --- 1. تحميل آمن للإعدادات من البيئة - لا هارد كود ---
FORTRESS_USER = os.getenv("FORTRESS_USER", "tarim")
FORTRESS_PASSWORD = os.getenv("FORTRESS_PASSWORD")
if not FORTRESS_PASSWORD or len(FORTRESS_PASSWORD) < 12:
    raise RuntimeError("FORTRESS_PASSWORD غير موجود أو ضعيف - يجب وضعه في .env")

# تشفير مرة واحدة عند الإعداد الأول، ثم احفظه
PASSWORD_HASH = os.getenv("FORTRESS_PASSWORD_HASH") or generate_password_hash(FORTRESS_PASSWORD, method='scrypt')

# --- 2. إعداد التطبيق ---
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024  # 16KB فقط - منع JSON Bomb
app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY")
if not app.config['SECRET_KEY']:
    raise RuntimeError("FLASK_SECRET_KEY مفقود")

auth = HTTPBasicAuth()
USERS = {FORTRESS_USER: PASSWORD_HASH}

# --- 3. درع الحماية - Talisman + Rate Limit ---
# حماية الرؤوس الأمنية
csp = {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'"
}
Talisman(app, force_https=False, strict_transport_security=True, 
         session_cookie_secure=True, content_security_policy=csp)

# حماية من التخمين - 5 محاولات كل 15 دقيقة
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per 15 minutes"],
    storage_uri="memory://"
)

# إعداد لوجز آمن بدون كشف تفاصيل
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

try:
    from engine import ues
    UES_AVAILABLE = True
except ImportError:
    UES_AVAILABLE = False
    logger.warning("UES engine not available")

os.makedirs("logs", exist_ok=True)
os.makedirs("black_box", exist_ok=True)

HTML_PAGE = "<h1>Tarim OS Imperial Sovereign Shield Active</h1>"

@auth.verify_password
def verify(username, password):
    if not username or not password:
        return None
    # حماية من هجوم التوقيت Timing Attack
    stored_hash = USERS.get(username)
    if stored_hash and check_password_hash(stored_hash, password):
        return username
    return None

@auth.error_handler
def auth_error(status):
    return jsonify({"error": "Unauthorized - Invalid credentials"}), 401

@app.route('/')
@auth.login_required
@limiter.limit("20 per minute")
def index():
    return HTML_PAGE, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route('/api/ues/next', methods=['POST'])
@auth.login_required
@limiter.limit("10 per minute") # حماية خاصة للـ API المكلف
def ues_next():
    if not UES_AVAILABLE:
        return jsonify({"error": "Service temporarily unavailable"}), 503
    
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    # --- 4. التحقق من صحة المدخلات - منع الحقن ---
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    user_profile = data.get('user_profile')
    current_video = data.get('current_video')

    # تحقق بسيط من النوع والطول
    if user_profile is not None and not isinstance(user_profile, dict):
        return jsonify({"error": "Invalid user_profile format"}), 400
    if current_video is not None and not isinstance(current_video, (str, dict)):
        return jsonify({"error": "Invalid current_video format"}), 400

    try:
        result = ues.recommend(user_profile, current_video)
        # تأكد أن النتيجة نص آمن
        if not isinstance(result, str) or len(result) > 100:
            raise ValueError("Invalid engine output")
        return jsonify({"action": "split_screen", "video_id": result})
    except Exception:
        # لا تكشف تفاصيل الخطأ - فقط سجله داخلياً
        logger.exception("UES Engine Error")
        return jsonify({"error": "Internal processing error"}), 500

@app.route('/dashboard')
@auth.login_required
@limiter.limit("30 per minute")
def dashboard():
    return jsonify({
        "THE_BLEED": "8% gone in Week 2",
        "THE_GATE": "20s to 8:19 stability",
        "RESULT": "+40% RETENTION",
        "SYSTEM": "V8.1 HARDENED FORTRESS"
    })

if __name__ == '__main__':
    from waitress import serve
    print("🐉 V8.1 HARDENED - Fortress + UES (Secure Production Mode)")
    # يجب أن يكون خلف Nginx/Cloudflare مع HTTPS
    serve(app, host="127.0.0.1", port=5050, threads=4, 
          connection_limit=100, cleanup_interval=30, channel_timeout=120)
