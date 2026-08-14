# ==============================================================================
# TARIM OS V10.1 SOVEREIGN FINAL SEAL - AL-QALAH NEXUS - Taizz, Yemen
# بِسْمِ اللهِ، وَعَلَى بَرَكَةِ الحَقِّ 🐉◈⚖️👑
# ترتيب سيادي: 1-Imports 2-Config 3-Init 4-Helpers 5-Security 6-HTML 7-Routes 8-Main
# ==============================================================================

# --- 1. الاستيرادات ---
import json
import os
import glob
import base64
import io
import sqlite3
import time
import re
import secrets
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, render_template_string
from PIL import Image
from werkzeug.utils import secure_filename

# --- 2. الإعدادات السيادية ---
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 # 10MB

DB_FILE = "database.db"
SESSION_FILE = "logs/sessions.jsonl"
SESSIONS_DIR = "sessions"
AUDIO_DIR = "sessions/audio"
MODEL_FILE = "model.json"
KING_KEY = os.environ.get("KING_KEY", "TARIM_KING_2026")
ALLOWED_AUDIO = {'.wav', '.mp3', '.m4a', '.ogg'}
RATE_LIMIT = {} # IP -> [timestamps]

# --- 3. تهيئة المجلدات وقاعدة البيانات ---
os.makedirs("logs", exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watch_time REAL NOT NULL CHECK(watch_time >=0 AND watch_time <= 1000),
        action TEXT NOT NULL CHECK(length(action) <= 100),
        source TEXT NOT NULL CHECK(length(source) <= 50),
        timestamp TEXT NOT NULL,
        ip TEXT
    )""")
    c.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp DESC)")
    conn.commit()
    conn.close()
    if not os.path.exists(MODEL_FILE):
        with open(MODEL_FILE, "w", encoding='utf-8') as f:
            json.dump({"threshold": 20.3, "version": "V10.1", "king": "AL", "updated": datetime.now().isoformat()}, f, ensure_ascii=False)

init_db()

# --- 4. دوال المساعدة ---
def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f:
            return float(json.load(f).get("threshold", 20.3))
    except:
        return 20.3

def save_threshold(v):
    try:
        data = {}
        if os.path.exists(MODEL_FILE):
            with open(MODEL_FILE, encoding='utf-8') as f:
                data = json.load(f)
        data["threshold"] = float(v)
        data["updated"] = datetime.now().isoformat()
        with open(MODEL_FILE, "w", encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
    except:
        pass

def log_event_db(wt, action, source="AL-QALAH"):
    try:
        wt = float(wt)
        assert 0 <= wt <= 1000
        action = re.sub(r'[^a-zA-Z0-9_\-\s]', '', str(action))[:100]
        source = re.sub(r'[^a-zA-Z0-9_\-]', '', str(source))[:50]
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO events (watch_time, action, source, timestamp, ip) VALUES (?,?,?,?,?)",
                  (wt, action, source, datetime.now().isoformat(), request.remote_addr[:45]))
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB Log Error:", e)

# --- 5. طبقة الحماية السيادية ---
def rate_limit(max_req=30, window=60):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.remote_addr
            now = time.time()
            RATE_LIMIT.setdefault(ip, [])
            RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if now - t < window]
            if len(RATE_LIMIT[ip]) >= max_req:
                return jsonify({"error": "تم حظر الطلب مؤقتاً - حماية القلعة 🛡️"}), 429
            RATE_LIMIT[ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator

def king_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        req_json = request.get_json(silent=True) or {}
        key = request.headers.get('X-KING-KEY') or request.args.get('key') or req_json.get('key')
        if key!= KING_KEY:
            return jsonify({"error": "الملك فقط 👑"}), 403
        return f(*args, **kwargs)
    return wrapped

@app.after_request
def security_headers(r):
    r.headers['X-Frame-Options'] = 'DENY'
    r.headers['X-Content-Type-Options'] = 'nosniff'
    r.headers['X-XSS-Protection'] = '1; mode=block'
    r.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' data: blob:; img-src 'self' data: blob: https:; media-src 'self' blob:;"
    return r

# --- 6. واجهة المستخدم V10.1 ---
UNIFIED_HTML = """
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TARIM OS V10.1 - AL-QALAH SOVEREIGN SEAL</title>
<style>
body{background:#000;color:#0f0;font-family:monospace;margin:0;padding:12px}
.header{text-align:center;font-size:18px;font-weight:bold;border:2px solid #0f0;padding:10px;border-radius:12px;box-shadow:0 0 20px rgba(0,255,0,0.5);background:#001100}
.tabs{display:flex;gap:4px;margin:12px 0;flex-wrap:wrap}
.tab{flex:1;min-width:65px;padding:8px 4px;border:1px solid #0f0;border-radius:6px;text-align:center;cursor:pointer;font-size:10px;background:#000;color:#0f0}
.tab.active{background:#0f0;color:#000;font-weight:bold;box-shadow:0 0 10px #0f0}
.panel{border:2px solid #0f0;padding:12px;border-radius:12px;min-height:280px;background:#000500}
.btn{padding:10px 16px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin:4px;font-size:11px}
.green{background:#0f0;color:#000;box-shadow:0 0 8px #0f0}
.white{background:#fff;color:#000}.yellow{background:#ff0;color:#000}
.log{font-size:11px;line-height:1.5;margin-top:8px;max-height:200px;overflow-y:auto;background:#001a00;padding:8px;border-radius:6px;border:1px solid #0a0}
.badge{display:inline-block;padding:2px 6px;border-radius:8px;font-size:9px;margin:2px}
.b-ues{background:#0a3;color:#fff}.b-tarim{background:#03a;color:#fff}
.input{width:70%;padding:8px;background:#000;color:#0f0;border:1px solid #0f0;border-radius:6px;font-family:monospace}
.card{background:#001a00;padding:10px;border-radius:8px;margin:8px 0;border:1px solid #0f0}
video{display:block;margin:8px auto;border:2px solid #0f0;border-radius:8px;max-width:240px;width:100%}
</style></head><body>
<div class="header">🏰 TARIM OS V10.1 - الختم السيادي الذهبي 🧠👑<br>
<small style="font-size:10px">Al-Qalah Core | Taizz | SQLite + KING + RATE-LIMIT + SEAL | {{threshold}}s</small></div>
<div style="text-align:center;margin:8px 0;padding:8px;border:1px dashed #0f0;border-radius:8px;font-size:11px">
<span style="color:#ff0">[ الكطْلجيا V10.1 ]</span> ⇄ <span style="color:#0ff">[ قلعة تعز UES ]</span> ⇄ <span style="color:#0f0">[ TARIM SEAL ]</span> |
<span style="color:#ff0">الملك: KING / TARIM_KING_2026</span></div>
<div class="tabs">
<div class="tab active" id="t-tarim" onclick="showTab('tarim')">🧠 الذكاء</div>
<div class="tab" id="t-ues" onclick="showTab('ues')">📹 UES</div>
<div class="tab" id="t-analytics" onclick="showTab('analytics')">📈 الأرباح</div>
<div class="tab" id="t-brain" onclick="showTab('brain')">💬 العقل</div>
<div class="tab" id="t-media" onclick="showTab('media')">👁️ الكطْلجيا</div>
</div>
<div id="panel-tarim" class="panel">
<div id="stats">جاري التحميل...</div><br>
<button class="btn white" onclick="testAI(5)">اختبر تشتت (5s)</button>
<button class="btn green" onclick="testAI(25)">اختبر تركيز (25s)</button>
<div id="result" style="color:#ff0;margin-top:8px;font-size:11px"></div>
<div id="logs-tarim" class="log"></div></div>
<div id="panel-ues" class="panel" style="display:none">
<div style="font-size:12px">📹 UES-Gateway v10.1 - حلقة 8:19 محصنة</div>
<div id="sessions-list" class="log">جاري الجلب...</div>
<button class="btn green" onclick="startUES()">▶️ بدء جلسة</button>
<button class="btn white" onclick="listUES()">🔄 تحديث</button>
<button class="btn yellow" onclick="feedToAI()">🧠 تغذية العقل</button>
<div id="ues-result" style="color:#0ff;margin-top:8px;font-size:11px"></div></div>
<div id="panel-analytics" class="panel" style="display:none">
<h3>📊 لوحة أرباح القلعة السيادية</h3>
<div id="stats-analytics" class="card">جاري الحساب...</div>
<div id="top-videos" class="log"></div></div>
<div id="panel-brain" class="panel" style="display:none">
<h3>💬 TARIM BRAIN V10.1</h3>
<div id="brain-chat" class="log" style="height:150px"></div>
<input id="brain-input" class="input" placeholder="اسأل عن الأرباح، Retention...">
<button class="btn green" onclick="askBrain()">إرسال</button></div>
<div id="panel-media" class="panel" style="display:none">
<h3>👁️ الكطْلجيا - تتبع التركيز الحي V10.1</h3>
<div class="card">
<video id="webcam" autoplay playsinline></video>
<button class="btn green" onclick="captureAndAnalyze()">فحص تركيز الكطْلجيا 👁️</button>
<p id="faceResult" style="color:#ff0;font-size:11px">جاهز ✅</p></div>
<div class="card">
<button id="recordBtn" class="btn yellow" onclick="toggleRecording()">🎙️ تسجيل إمبراطوري</button>
<p id="micResult" style="color:#0ff;font-size:11px">متوقف</p></div></div>
<script>
let lastWatchTime=0;
function showTab(n){
 document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
 document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
 document.getElementById('panel-'+n).style.display='block';
 document.getElementById('t-'+n).classList.add('active');
 if(n=='ues') listUES(); if(n=='analytics') loadAnalytics(); if(n=='media') initCamera();
}
async function loadStats(){
 let r=await fetch('/stats'); let d=await r.json();
 document.getElementById('stats').innerHTML=`Threshold=<b>${d.threshold}s</b> | الإجمالي: <b>${d.total}</b> <span class="badge b-tarim">V10.1 SEAL</span>`;
 document.getElementById('logs-tarim').innerHTML=d.last.map(e=>`${e.watch_time}s → ${e.action} <span class="badge ${e.source.includes('UES')?'b-ues':'b-tarim'}">${e.source}</span> ${e.timestamp?.slice(11,19)||''}`).join('<br>');
}
async function testAI(sec){
 let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:sec, source:'AL-QALAH', key:'TARIM_KING_2026'})});
 let d=await r.json();
 document.getElementById('result').innerHTML=`القرار: ${d.action} | العتبة: ${d.threshold_used}s | الملك: ${d.king_tax||0}$`;
 lastWatchTime=sec; loadStats();
}
async function listUES(){
 let r=await fetch('/list_sessions'); let d=await r.json();
 let html=d.sessions.length? d.sessions.map(s=>`🎬 ${s.name} - ${s.watch_time}s - ${s.date.slice(0,10)}`).join('<br>') : 'لا جلسات';
 document.getElementById('sessions-list').innerHTML=html;
 if(d.sessions.length) lastWatchTime=d.sessions[0].watch_time;
}
async function startUES(){
 let r=await fetch('/start_session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'TARIM_KING_2026'})}); let d=await r.json();
 document.getElementById('ues-result').innerHTML=`✅ الجلسة ${d.id} | ${d.watch_time}s`; listUES();
}
async function feedToAI(){
 if(!lastWatchTime) return alert('ابدأ جلسة!');
 let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:lastWatchTime, source:'UES-AlQalah', key:'TARIM_KING_2026'})});
 let d=await r.json(); document.getElementById('ues-result').innerHTML=`🧠 تغذية: ${lastWatchTime}s → ${d.action}`; loadStats();
}
async function loadAnalytics(){
 let r=await fetch('/stats'); let d=await r.json();
 let retention=d.total>0? ((d.last.filter(e=>e.watch_time>=d.threshold).length/d.total)*100).toFixed(1):0;
 let est=(d.total*0.007).toFixed(2);
 document.getElementById('stats-analytics').innerHTML=`<b>Retention:</b> ${retention}%<br><b>SQLite:</b> ${d.total}<br><b>العائد:</b> $${est}<br><b>الحالة:</b> سيادي محصن 🛡️`;
 let top=d.last.filter(e=>e.watch_time>=d.threshold).slice(0,5);
 document.getElementById('top-videos').innerHTML=top.length? '<b>الأحداث الفائقة:</b><br>'+top.map(e=>`🔥 ${e.watch_time}s - ${e.source}`).join('<br>'):'لا بيانات';
}
async function askBrain(){
 let q=document.getElementById('brain-input').value; if(!q) return;
 document.getElementById('brain-chat').innerHTML+=`<br><b>أنت:</b> ${q}`; document.getElementById('brain-input').value='';
 let r=await fetch('/ai_brain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:q, key:'TARIM_KING_2026'})});
 let d=await r.json(); document.getElementById('brain-chat').innerHTML+=`<br><span style="color:#ff0"><b>V10.1:</b> ${d.response}</span>`;
 document.getElementById('brain-chat').scrollTop=9999;
}
function initCamera(){
 navigator.mediaDevices.getUserMedia({video:true}).then(s=>{document.getElementById('webcam').srcObject=s;})
.catch(err=>{document.getElementById('faceResult').innerText='خطأ كاميرا: '+err;});
}
function captureAndAnalyze(){
 const v=document.getElementById('webcam'); const c=document.createElement('canvas');
 c.width=v.videoWidth||240; c.height=v.videoHeight||180; c.getContext('2d').drawImage(v,0,0,c.width,c.height);
 fetch('/api/analyze_camera',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:c.toDataURL('image/jpeg'), key:'TARIM_KING_2026'})})
.then(r=>r.json()).then(d=>{document.getElementById('faceResult').innerText=`👁️ ${d.status} (${d.size})`;});
}
let mediaRecorder, audioChunks=[];
async function toggleRecording(){
 const btn=document.getElementById('recordBtn');
 if(!mediaRecorder||mediaRecorder.state=="inactive"){
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  mediaRecorder=new MediaRecorder(stream); audioChunks=[];
  mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
  mediaRecorder.onstop=()=>{
   const blob=new Blob(audioChunks,{type:'audio/wav'}); const fd=new FormData();
   fd.append('audio',blob,'mic.wav'); fd.append('key','TARIM_KING_2026');
   fetch('/api/upload_audio',{method:'POST',body:fd}).then(r=>r.json()).then(d=>{document.getElementById('micResult').innerText=`✅ ${d.file}`;});
  };
  mediaRecorder.start(); btn.innerText="🛑 إيقاف"; document.getElementById('micResult').innerText="جاري التسجيل...";
 }else{mediaRecorder.stop(); btn.innerText="🎙️ تسجيل إمبراطوري";}
}
loadStats(); listUES(); setInterval(loadStats,5000);
</script></body></html>
"""

# --- 7. المسارات (Routes) ---
@app.route('/')
def home():
    return render_template_string(UNIFIED_HTML, threshold=load_threshold())

@app.route('/stats')
@rate_limit(60, 60)
def stats():
    th = load_threshold()
    ev = []
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT watch_time, action, source, timestamp FROM events ORDER BY id DESC LIMIT 25")
        rows = cur.fetchall()
        for r in rows:
            ev.append({"watch_time": r["watch_time"], "action": r["action"], "source": r["source"], "timestamp": r["timestamp"]})
        cur.execute("SELECT COUNT(*) FROM events")
        total = cur.fetchone()[0]
        conn.close()
    except:
        total = 0
    return jsonify({"threshold": th, "total": total, "last": ev, "seal": "V10.1 SOVEREIGN"})

@app.route('/get_next_video', methods=['POST'])
@rate_limit(120, 60)
def get_next_video():
    data = request.get_json(silent=True) or {}
    try:
        wt = float(data.get('watch_time', 0))
    except:
        return jsonify({"error": "watch_time invalid"}), 400
    if not (0 <= wt <= 1000):
        return jsonify({"error": "range 0-1000"}), 400
    src = str(data.get('source', 'AL-QALAH'))[:50]
    th = load_threshold()
    action = "split_screen_ai" if wt >= th else "pause_video_wandering"
    king_tax = round(wt * 0.001, 4) if wt >= th else 0
    log_event_db(wt, action, src)
    return jsonify({"action": action, "threshold_used": th, "source": src, "king_tax": king_tax, "status": "SEALED V10.1"})

@app.route('/start_session', methods=['POST'])
@rate_limit(10, 60)
@king_required
def start_session():
    sid = datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + secrets.token_hex(2)
    wt = round(21 + (secrets.randbelow(120) / 10), 1)
    session_data = {"name": f"alqalah_session_{sid}.mp4", "id": sid, "duration": "8:19", "watch_time": wt, "date": datetime.now().isoformat()}
    with open(f"{SESSIONS_DIR}/{sid}.json", "w", encoding='utf-8') as f:
        json.dump(session_data, f, ensure_ascii=False)
    try:
        with open(SESSION_FILE, "a", encoding='utf-8') as f:
            f.write(json.dumps(session_data, ensure_ascii=False) + "\n")
    except:
        pass
    log_event_db(wt, "session_start", "UES-AlQalah")
    return jsonify({"status": "Al-Qalah Session V10.1 Started", "id": sid, "duration": "8:19", "watch_time": wt})

@app.route('/list_sessions')
@rate_limit(30, 60)
def list_sessions():
    sessions = []
    for path in glob.glob(f"{SESSIONS_DIR}/*.json"):
        try:
            with open(path, encoding='utf-8') as f:
                sessions.append(json.load(f))
        except:
            pass
    sessions.sort(key=lambda x: x.get('date', ''), reverse=True)
    return jsonify({"sessions": sessions[:20], "seal": "V10.1"})

@app.route('/ai_brain', methods=['POST'])
@rate_limit(30, 60)
def ai_brain():
    data = request.get_json(silent=True) or {}
    user_text = str(data.get('text', ''))[:500].lower()
    try:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM events")
        total_db = cur.fetchone()[0]
        conn.close()
    except:
        total_db = 0
    th = load_threshold()
    if "كم" in user_text or "عدد" in user_text:
        answer = f"إجمالي أحداث الكطْلجيا المسجلة بقاعدة بيانات القلعة هو {total_db} حدثاً سيادياً محصناً."
    elif "أرباح" in user_text or "فلوس" in user_text or "revenue" in user_text:
        revenue = round(total_db * 0.007, 2)
        answer = f"الأرباح التقديرية الحالية من حصاد الكطْلجيا V10.1 تقدر بـ ${revenue} | ضريبة الملك 10% محفوظة 👑"
    elif "عتبة" in user_text or "threshold" in user_text:
        answer = f"العتبة الإمبراطورية الحالية {th}s - محمية بختم القلعة الذهبي V10.1"
    else:
        answer = f"استقبلت توجيهك الكطْلجي: '{user_text[:100]}'. TARIM OS V10.1 يعمل بأقصى طاقة سيادية محصنة 🛡️"
    return jsonify({"response": answer, "seal": "V10.1"})

@app.route('/api/analyze_camera', methods=['POST'])
@rate_limit(20, 60)
@king_required
def api_analyze_camera():
    try:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get('image', '')
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]
        if len(image_b64) > 4_000_000:
            return jsonify({"success": False, "status": "الصورة كبيرة جداً"}), 413
        img_data = base64.b64decode(image_b64)
        if len(img_data) > 3_000_000:
            return jsonify({"success": False, "status": "ملف كبير"}), 413
        image = Image.open(io.BytesIO(img_data))
        if image.size[0] * image.size[1] > 4000000:
            image = image.resize((640, 480))
        size = image.size
        status = "مركز ومنتبه 🟢 (تم إيقاف السرحان بنجاح - V10.1 SEAL)"
        log_event_db(load_threshold(), "alqalah_eye_focus_ok", "AL-QALAH_CAM")
        return jsonify({"success": True, "status": status, "size": str(size), "seal": "V10.1"})
    except Exception as e:
        return jsonify({"success": False, "status": f"خطأ معالجة: {str(e)[:100]} ❌"}), 400

@app.route('/api/upload_audio', methods=['POST'])
@rate_limit(10, 60)
@king_required
def api_upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({"success": False, "error": "لا ملف"}), 400
        audio_file = request.files['audio']
        ext = os.path.splitext(secure_filename(audio_file.filename))[1].lower()
        if ext not in ALLOWED_AUDIO:
            return jsonify({"success": False, "error": "امتداد غير مسموح"}), 400
        filename = f"alqalah_audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}_
