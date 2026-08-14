cd ~/tarim_gateway && rm -f app_v101.py run.py && cat > app.py << 'PY'
from flask import Flask, request, jsonify, render_template_string
import json, os, glob, base64, io, sqlite3, time, re, secrets
from datetime import datetime
from functools import wraps
from PIL import Image
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

DB_FILE = "database.db"
SESSION_FILE = "logs/sessions.jsonl"
SESSIONS_DIR = "sessions"
AUDIO_DIR = "sessions/audio"
MODEL_FILE = "model.json"
KING_KEY = os.environ.get("KING_KEY", "TARIM_KING_2026")
ALLOWED_AUDIO = {'.wav','.mp3','.m4a','.ogg'}
RATE_LIMIT = {}

os.makedirs("logs", exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, watch_time REAL NOT NULL CHECK(watch_time >=0 AND watch_time <= 1000), action TEXT NOT NULL, source TEXT NOT NULL, timestamp TEXT NOT NULL, ip TEXT)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp DESC)")
    conn.commit()
    conn.close()
    if not os.path.exists(MODEL_FILE):
        with open(MODEL_FILE, "w", encoding='utf-8') as f:
            json.dump({"threshold": 20.3, "version": "V10.1", "king": "AL", "updated": datetime.now().isoformat()}, f, ensure_ascii=False)

init_db()

def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f:
            return float(json.load(f).get("threshold", 20.3))
    except: return 20.3

def log_event_db(wt, action, source="AL-QALAH"):
    try:
        wt = float(wt)
        assert 0 <= wt <= 1000
        action = re.sub(r'[^a-zA-Z0-9_\-\s]', '', str(action))[:100]
        source = re.sub(r'[^a-zA-Z0-9_\-]', '', str(source))[:50]
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO events (watch_time, action, source, timestamp, ip) VALUES (?,?,?,?,?)", (wt, action, source, datetime.now().isoformat(), request.remote_addr[:45]))
        conn.commit()
        conn.close()
    except Exception as e: print("DB Error:", e)

def rate_limit(max_req=30, window=60):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.remote_addr
            now = time.time()
            RATE_LIMIT.setdefault(ip, [])
            RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if now - t < window]
            if len(RATE_LIMIT[ip]) >= max_req: return jsonify({"error": "Rate limited"}), 429
            RATE_LIMIT[ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator

def king_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        req_json = request.get_json(silent=True) or {}
        key = request.headers.get('X-KING-KEY') or request.args.get('key') or req_json.get('key')
        if key!= KING_KEY: return jsonify({"error": "KING ONLY"}), 403
        return f(*args, **kwargs)
    return wrapped

@app.after_request
def security_headers(r):
    r.headers['X-Frame-Options'] = 'DENY'
    r.headers['X-Content-Type-Options'] = 'nosniff'
    return r

HTML = """<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TARIM V10.2</title><style>body{background:#000;color:#0f0;font-family:monospace;margin:0;padding:12px}.header{text-align:center;border:2px solid #0f0;padding:10px;border-radius:12px;background:#001100}.tab{flex:1;padding:8px;border:1px solid #0f0;border-radius:6px;text-align:center;cursor:pointer;margin:2px}.tab.active{background:#0f0;color:#000}.panel{border:2px solid #0f0;padding:12px;border-radius:12px;min-height:200px;background:#000500}.btn{padding:8px 14px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin:4px}.green{background:#0f0;color:#000}.log{background:#001a00;padding:8px;border-radius:6px;max-height:200px;overflow:auto}</style></head><body>
<div class="header">TARIM OS V10.2 - SOVEREIGN SEAL<br><small>Taizz | Threshold {{threshold}}s | KING: TARIM_KING_2026</small></div>
<div style="display:flex;flex-wrap:wrap;margin:10px 0"><div class="tab active" onclick="location.reload()">🧠 الذكاء</div><div class="tab" onclick="alert('V10.2 Working')">📹 UES</div><div class="tab" onclick="alert('KING OK')">👑 الملك</div></div>
<div class="panel"><div id="stats">Loading...</div><br><button class="btn green" onclick="testAI(25)">اختبر 25s</button><div id="result"></div><div id="logs" class="log"></div></div>
<script>
async function loadStats(){let r=await fetch('/stats');let d=await r.json();document.getElementById('stats').innerHTML='Threshold='+d.threshold+'s | Total='+d.total;document.getElementById('logs').innerHTML=d.last.map(e=>e.watch_time+'s -> '+e.action).join('<br>');}
async function testAI(sec){let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:sec,source:'AL-QALAH',key:'TARIM_KING_2026'})});let d=await r.json();document.getElementById('result').innerHTML=d.action+' | tax='+d.king_tax;loadStats();}
loadStats();
</script></body></html>"""

@app.route('/')
def home(): return render_template_string(HTML, threshold=load_threshold())

@app.route('/stats')
@rate_limit(60,60)
def stats():
    th=load_threshold(); ev=[]
    try:
        conn=sqlite3.connect(DB_FILE); conn.row_factory=sqlite3.Row; cur=conn.cursor()
        cur.execute("SELECT watch_time, action, source, timestamp FROM events ORDER BY id DESC LIMIT 25")
        for r in cur.fetchall(): ev.append({"watch_time":r["watch_time"],"action":r["action"],"source":r["source"],"timestamp":r["timestamp"]})
        cur.execute("SELECT COUNT(*) FROM events"); total=cur.fetchone()[0]; conn.close()
    except: total=0
    return jsonify({"threshold":th,"total":total,"last":ev})

@app.route('/get_next_video', methods=['POST'])
@rate_limit(120,60)
def get_next_video():
    data=request.get_json(silent=True) or {}
    try: wt=float(data.get('watch_time',0))
    except: return jsonify({"error":"invalid"}),400
    if not (0 <= wt <= 1000): return jsonify({"error":"range"}),400
    src=str(data.get('source','AL-QALAH'))[:50]
    th=load_threshold()
    action="split_screen_ai" if wt >= th else "pause_video_wandering"
    king_tax=round(wt*0.001,4) if wt >= th else 0
    log_event_db(wt,action,src)
    return jsonify({"action":action,"threshold_used":th,"king_tax":king_tax})

@app.route('/start_session', methods=['POST'])
@rate_limit(10,60)
@king_required
def start_session():
    sid=datetime.now().strftime("%Y%m%d_%H%M%S")+"_"+secrets.token_hex(2)
    wt=round(21 + (secrets.randbelow(120)/10),1)
    data={"name":"session_"+sid+".mp4","id":sid,"duration":"8:19","watch_time":wt,"date":datetime.now().isoformat()}
    with open(f"{SESSIONS_DIR}/{sid}.json","w",encoding='utf-8') as f: json.dump(data,f,ensure_ascii=False)
    log_event_db(wt,"session_start","UES")
    return jsonify(data)

if __name__ == '__main__':
    th=load_threshold()
    print("="*60)
    print("TARIM OS V10.2 SOVEREIGN - CLEAN FOR TERMUX")
    print("Threshold:",th,"KING: TARIM_KING_2026 Port:5001")
    print("="*60)
    app.run(host='0.0.0.0', port=5001, debug=False)
PY
python3 app.py
