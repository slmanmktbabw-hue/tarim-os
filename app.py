# -*- coding: utf-8 -*-
# Tarim_Fortress V8.0 - IMPERIAL MERGE - القلعة + محرك UES
import os, base64, json, datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_httpauth import HTTPBasicAuth

# استيراد المحرك السيادي - إذا مو موجود يشتغل بدونه
try:
    from engine import ues
    UES_AVAILABLE = True
except:
    UES_AVAILABLE = False
    print("⚠️ engine.py غير موجود - القلعة ستعمل بدون UES")

app = Flask(__name__)
auth = HTTPBasicAuth()
USERS = {"tarim": "fortress2026"}
@auth.verify_password
def verify(u,p): return u if USERS.get(u)==p else None

os.makedirs("logs", exist_ok=True)
os.makedirs("black_box", exist_ok=True)

# ... الصق هنا باقي HTML_PAGE حقك كامل من الكود اللي أرسلته ...

@app.route('/')
@auth.login_required
def index(): return HTML_PAGE

@app.route('/api/ues/next', methods=['POST'])
@auth.login_required
def ues_next():
    if not UES_AVAILABLE:
        return jsonify({"error": "engine.py missing"})
    data = request.json
    result = ues.recommend(data.get('user_profile'), data.get('current_video'))
    return jsonify({"action": "split_screen", "video_id": result, "proof": "20s to 8:19"})

@app.route('/dashboard')
@auth.login_required
def dashboard():
    return jsonify({
        "THE_BLEED": "8% gone in Week 2",
        "THE_GATE": "20s to 8:19 stability",
        "RESULT": "+40% RETENTION",
        "SYSTEM": "V6.5 + UES MERGED - FORTRESS 2026"
    })

if __name__ == '__main__':
    from waitress import serve
    print("🐉 V8.0 IMPERIAL MERGE - Fortress + UES - tarim / fortress2026")
    serve(app, host="0.0.0.0", port=5050, threads=4)
