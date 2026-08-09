# app.py - UES-Gateway V2.1 SECURE - محصن 100% - Rule-Based + حماية كاملة
from flask import Flask, request, jsonify
import secrets
import re
import time
import logging
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 # 16KB فقط - حماية من JSON الضخم
logging.basicConfig(level=logging.INFO)

# ========= إعدادات الأمان =========
ALLOWED_COUNTRIES = {'YE','SA','US','EG','AE','DE'}
ALLOWED_INTERESTS = {'cooking','sports','fitness','travel','general','tech','news'}
ALLOWED_VIDEOS = {
    "short_funny_01","short_tip_02","short_news_03",
    "protein_recipe_15s_003","local_street_food_15s_004",
    "ye_cooking_restaurant_001","ye_football_highlights_002",
    "shocking_curiosity_video_999","trending_01","trending_02","trending_03"
}

RATE_LIMIT = {}
def rate_limit(max_req=60, window=60):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args,**kwargs):
            ip = request.remote_addr or '127.0.0.1'
            now = time.time()
            RATE_LIMIT.setdefault(ip, [])
            RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if now - t < window]
            if len(RATE_LIMIT[ip]) >= max_req:
                return jsonify({"error":"كثير من الطلبات - حاول بعد دقيقة"}), 429
            RATE_LIMIT[ip].append(now)
            return fn(*args,**kwargs)
        return wrapper
    return decorator

def sanitize_text(t, max_len=20):
    if not t: return ""
    t = str(t)[:max_len]
    t = re.sub(r'[^a-zA-Z0-9_\-]', '', t) # فقط حروف وأرقام
    return t.lower()

def secure_headers(resp):
    resp.headers['Content-Security-Policy'] = "default-src 'self'; frame-ancestors 'none'"
    resp.headers['X-Content-Type-Options'] = 'nosniff'
    resp.headers['X-Frame-Options'] = 'DENY'
    resp.headers['Referrer-Policy'] = 'no-referrer'
    return resp

@app.after_request
def after_request(response):
    return secure_headers(response)

# ========= المخ: UES Rule-Based Engine V2 SECURE =========
class UES_Engine:
    def __init__(self):
        self.rules_triggered = 0
        self.max_rules = 1000000 # حد أقصى لمنع Overflow

    def recommend(self, user_profile, current_video):
        country = sanitize_text(user_profile.get('country','US'), 5).upper()
        if country not in ALLOWED_COUNTRIES: country = 'US'

        interest = sanitize_text(user_profile.get('interest','general'), 20)
        if interest not in ALLOWED_INTERESTS: interest = 'general'

        try:
            duration = int(current_video.get('duration',30))
            duration = max(0, min(duration, 600)) # حد 0-600 ثانية
        except: duration = 30

        try:
            repeat = int(user_profile.get('repeat_count',0))
            repeat = max(0, min(repeat, 100))
        except: repeat = 0

        if self.rules_triggered < self.max_rules:
            self.rules_triggered += 1

        # القاعدة 1: كسر الملل
        if duration > 60:
            return secrets.choice(["short_funny_01","short_tip_02","short_news_03"])

        # القاعدة 2: التضاد
        if interest == 'fitness': return "protein_recipe_15s_003"
        if interest == 'travel': return "local_street_food_15s_004"

        # القاعدة 3: التخصيص حسب البلد
        if country == 'YE' and interest == 'cooking': return "ye_cooking_restaurant_001"
        if country == 'YE' and interest == 'sports': return "ye_football_highlights_002"

        # القاعدة 4: صدمة الفضول
        if repeat >= 3: return "shocking_curiosity_video_999"

        return secrets.choice(["trending_01","trending_02","trending_03"])

engine = UES_Engine()

# ========= البوابة: UES-Gateway API SECURE =========
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "UES-Gateway v2.1 SECURE LIVE",
        "timestamp": datetime.utcnow().isoformat(),
        "secure": True
    })

@app.route('/get_next_video', methods=['POST'])
@rate_limit(60, 60)
def get_next_video():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"action":"wait","reason":"no_data"}), 200

        user_profile = data.get('user_profile',{})
        current_video = data.get('current_video',{})

        if not isinstance(user_profile, dict) or not isinstance(current_video, dict):
            return jsonify({"action":"wait","reason":"invalid_format"}), 200

        try:
            watch_time = int(current_video.get('watch_time',0))
            watch_time = max(0, min(watch_time, 10000))
        except: watch_time = 0

        if watch_time > 20:
            next_video_id = engine.recommend(user_profile, current_video)
            # تأكد أن الفيديو مسموح
            if next_video_id not in ALLOWED_VIDEOS:
                next_video_id = "trending_01"

            return jsonify({
                "action": "split_screen",
                "video_id": next_video_id,
                "trigger": "20s_boredom_wall",
                "gateway_version": "v2.1-secure"
            })
        return jsonify({"action":"wait"})

    except Exception as e:
        # لا نكشف الخطأ الداخلي للعميل - نسجله فقط
        app.logger.error(f"UES Error: {e}")
        return jsonify({"action":"wait","error":"internal"}), 200

@app.route('/dashboard', methods=['GET'])
@rate_limit(30, 60)
def dashboard():
    return jsonify({
        "gateway_version": "v2.1-secure",
        "engine_type": "Rule-Based Recommender SECURE",
        "avg_session_stability": "N/A - Prototype",
        "target_stability_after_AI": "8:19",
        "baseline_before_ues": "0:20",
        "lift_projected": "25x",
        "rules_triggered_total": min(engine.rules_triggered, 1000000),
        "security": ["CSP","RateLimit","Sanitize","NoStackLeak","AllowedList","MaxLength"],
        "status": "SECURE - Ready for GPU funding",
        "note": "This is a secure rule-based prototype. 8:19 target requires ML model + GPU"
    })

if __name__ == '__main__':
    print("👑 UES-Gateway v2.1 SECURE Starting... Target: 20s -> 8:19 | SECURE MODE ON")
    app.run(host='0.0.0.0', port=5000, debug=False)
