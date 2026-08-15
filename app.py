from flask import Flask, request, jsonify, render_template_string, send_from_directory
import json, os, glob, base64, io, sqlite3, threading, time, hashlib, sys
from datetime import datetime
from collections import defaultdict
from multiprocessing import shared_memory, Value as MPValue, Lock as MPLock

try:
    from PIL import Image
    PIL_OK = True
except:
    PIL_OK = False

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
app = Flask(__name__, static_folder='static')

BASE_DIR = "/sdcard/TARIM_OS"
DB_FILE = f"{BASE_DIR}/tarim_titan_{PORT}.sqlite"
DAILY_DIR = f"{BASE_DIR}/daily"
SESSIONS_DIR = f"{BASE_DIR}/sessions"
AUDIO_DIR = f"{SESSIONS_DIR}/audio"
VIDEOS_DIR = f"{BASE_DIR}/static/videos"
MODEL_FILE = f"{BASE_DIR}/model.json"
DAILY_SUMMARY_FILE = f"{BASE_DIR}/daily_summary.json"

DB_LOCK = threading.Lock()
DEVICE_ID = hashlib.sha256(f"node_{PORT}".encode()).hexdigest()[:8]

for d in [BASE_DIR, DAILY_DIR, SESSIONS_DIR, AUDIO_DIR, VIDEOS_DIR, f"{BASE_DIR}/static"]:
    os.makedirs(d, exist_ok=True)

def init_db():
    with DB_LOCK:
        conn = sqlite3.connect(DB_FILE, timeout=10.0)
        cur = conn.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS dag (hash TEXT PRIMARY KEY, data TEXT, sig TEXT, creator TEXT)")
        cur.execute("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, watch_time REAL, action TEXT, source TEXT, timestamp TEXT, data TEXT)")
        conn.commit(); conn.close()

def save_json_safe(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    tmp = filepath + ".tmp"
    try:
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, filepath)
    except Exception as e:
        print(f"Save Error: {e}")

def log_event_db(wt, action, source="AL-QALAH", event_data=None):
    with DB_LOCK:
        try:
            conn = sqlite3.connect(DB_FILE, timeout=10.0)
            cur = conn.cursor()
            cur.execute("INSERT INTO events (watch_time, action, source, timestamp, data) VALUES (?,?,?,?,?)",
                       (wt, action, source, datetime.now().isoformat(), json.dumps(event_data or {})))
            conn.commit(); conn.close()
        except Exception as e:
            print("DB Log Error:", e)

def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f: return json.load(f).get("threshold", 20.0)
    except: return 20.0

SHM_NAME = f"tarim_frame_{PORT}"
SHM_SIZE = 320*240*3
frame_counter = MPValue('i', 0)
frame_lock = MPLock()
try:
    shm = shared_memory.SharedMemory(name=SHM_NAME, create=True, size=SHM_SIZE)
except FileExistsError:
    shm = shared_memory.SharedMemory(name=SHM_NAME, create=False)
except:
    shm = None

def vision_producer():
    while True:
        try:
            with frame_lock:
                frame_counter.value += 1
            time.sleep(1/60)
        except: break

class GCounterCRDT:
    def __init__(self): self.counters = defaultdict(int)
    def inc(self, node, val): self.counters[node] += val
    def merge(self, other):
        for n, v in other.items(): self.counters[n] = max(self.counters[n], v)
    def value(self): return sum(self.counters.values())

CRDT = GCounterCRDT()
CRDT.inc(DEVICE_ID, 100)
VERTICES = {}
DAG = defaultdict(list)

class Vertex:
    def __init__(self, data, parents, vc):
        self.data = data; self.parents = parents; self.vc = vc
        self.creator = DEVICE_ID; self.ts = time.time()
        self.hash = hashlib.sha256((json.dumps(data, sort_keys=True)+str(sorted(parents))).encode()).hexdigest()
        self.sig = hashlib.sha256((DEVICE_ID+self.hash).encode()).hexdigest()
    def to_dict(self): return {"hash": self.hash, "data": self.data, "parents": self.parents, "vc": self.vc, "creator": self.creator, "ts": self.ts, "sig": self.sig}

def add_vertex(v, is_local=False):
    if v["hash"] in VERTICES: return False
    VERTICES[v["hash"]] = v
    DAG[v["hash"]] = v["parents"]
    if v["data"].get("type")=="transfer":
        if "crdt" in v["data"]: CRDT.merge(v["data"]["crdt"])
        else: CRDT.inc(v["creator"], v["data"].get("amount",0))
    with DB_LOCK:
        conn = sqlite3.connect(DB_FILE, timeout=10.0)
        cur = conn.cursor()
        cur.execute("INSERT OR IGNORE INTO dag VALUES (?,?,?,?)", (v["hash"], json.dumps(v["data"]), v["sig"], v["creator"]))
        conn.commit(); conn.close()
    save_json_safe(f"{DAILY_DIR}/json.{time.strftime('%Y%m%d')}.json", {"balance": CRDT.value(), "last": v["hash"]})
    return True

class CustomArena:
    def __init__(self, size_mb=5):
        import ctypes
        self.size = size_mb * 1024 * 1024
        self.pool = (ctypes.c_byte * self.size)()
        self.offset = 0
        self.lock = threading.Lock()
    def alloc(self, n):
        with self.lock:
            if self.offset + n > self.size: self.offset = 0
            p = self.offset; self.offset += n; return p

ARENA = CustomArena(5)

UNIFIED_HTML = """<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TARIM OS V13 + AI Shield</title><style>
*{box-sizing:border-box}
body{background:#0a0a0a;background-image:radial-gradient(circle at 1px 1px, #00ff0022 1px, transparent 0);background-size:20px 20px;color:#0f0;font-family:'Courier New',monospace;margin:0;padding:0;min-height:100vh}
.termux-top{background:#000;border-bottom:1px solid #0f0;padding:6px 10px;font-size:10px;color:#0f0;display:flex;justify-content:space-between;direction:ltr;position:sticky;top:0;z-index:100}
.termux-log{background:#000;color:#888;font-size:9px;padding:8px 10px;direction:ltr;border-bottom:1px solid #222;font-family:monospace;line-height:1.4}
.termux-log .green{color:#0f0}.termux-log .yellow{color:#ff0}.termux-log .cyan{color:#0ff}.termux-log .white{color:#fff}
.app-container{max-width:440px;margin:10px auto;padding:5px;background:#000;border:2px solid #0f0;border-radius:12px;box-shadow:0 0 20px #0f03}
.header{border:2px solid #0f0;padding:8px;border-radius:10px;text-align:center;font-weight:bold;background:#001100;margin-bottom:6px;font-size:12px}
.tabs{display:flex;gap:3px;margin:6px 0;overflow-x:auto}.tab{flex:1 0 15%;padding:7px 2px;border:1px solid #0f0;border-radius:6px;text-align:center;font-size:9px;background:#000;color:#0f0;cursor:pointer}.tab.active{background:#0f0;color:#000}
.panel{border:2px solid #0f0;padding:10px;border-radius:10px;min-height:60vh;background:#000500;display:none}.panel.active{display:block}
.btn{padding:10px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin:4px 0;width:100%}.green{background:#0f0;color:#000}.red{background:#ff0066;color:#fff}.white{background:#fff;color:#000}
.log{font-size:10px;max-height:30vh;overflow-y:auto;background:#001a00;padding:6px;border-radius:6px;border:1px solid #0a0}
.grid{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin:6px 0}.label{color:#00ffff;font-weight:bold;text-align:right;font-size:10px}.value{background:#000;padding:6px;border-radius:6px;border:1px solid #00ffff;color:#0f0;text-align:center;font-size:11px}
video{display:block;margin:6px auto;border:2px solid #0f0;border-radius:8px;max-width:220px;width:100%}
.cred-badge{background:linear-gradient(90deg,#0f0,#0ff);color:#000;font-size:8px;padding:3px 6px;border-radius:20px;font-weight:bold;display:inline-block;margin:2px}
/* AI Modal */
#aiModal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999;display:none;align-items:center;justify-content:center;direction:ltr}
#aiModal .modal-box{width:92%;max-width:380px;background:#000;border:2px solid #ffd700;border-radius:12px;padding:12px;max-height:80vh;display:flex;flex-direction:column}
.hidden{display:none !important}
</style></head><body>
<div class="termux-top"><span>📱 Termux • tarim@android + AI Shield</span><span style="color:#0ff">127.0.0.1:5001 ● LIVE</span></div>
<div class="termux-log"><span class="white">$</span> cd /sdcard/TARIM_OS && python app.py 5001<br><span class="green">👑 TARIM OS V13 TITAN + AI SHIELD V12 ON PORT 5001</span><br><span class="cyan">[*] DB_LOCK: OK | SHM: 230KB | ARENA: 5MB</span><br><span style="color:#ffd700">[*] AI Shield: Sovereign v12.0 HARDENED Loaded - Offline</span><br><span class="green">🚀 Server Running</span></div>

<div class="app-container">
<div class="header">👑 TARIM OS V13.0 + AI SHIELD V12 <span class="cred-badge">LIVE ON DEVICE</span> 👑<br><span style="font-size:9px;color:#ffd700">Sovereign AI Shield • Offline • No Cloud</span></div>
<div class="tabs">
<div class="tab active" id="t-dag" onclick="showTab('dag')">🔗 DAG</div>
<div class="tab" id="t-tarim" onclick="showTab('tarim')">🧠 الذكاء</div>
<div class="tab" id="t-media" onclick="showTab('media')">👁️ الرؤية</div>
<div class="tab" id="t-ai" onclick="showTab('ai')">🛡️ درع AI</div>
<div class="tab" id="t-ues" onclick="showTab('ues')">📹 UES</div>
<div class="tab" id="t-analytics" onclick="showTab('analytics')">📈 الأرباح</div>
</div>

<div id="panel-dag" class="panel active">
<div class="grid"><div class="label">Node ID:</div><div class="value" id="device">abf2dfcb</div></div>
<div class="grid"><div class="label">Balance:</div><div class="value" id="balance">100</div></div>
<div class="grid"><div class="label">DAG Size:</div><div class="value" id="dag-size">0</div></div>
<div class="grid"><div class="label">FPS SHM:</div><div class="value" id="fps">0</div></div>
<button class="btn green" onclick="sendTx(25)">+25 عملة</button>
<button class="btn red" onclick="sendTx(-10)">-10 عملة</button>
<div class="log" id="tx-log"></div>
</div>

<div id="panel-tarim" class="panel"><div id="stats"></div><br><button class="btn white" onclick="startCalibration()">🎯 معايرة</button><div id="calibResult"></div><br><div id="logs-tarim" class="log"></div></div>

<div id="panel-media" class="panel"><video id="webcam" autoplay playsinline muted></video><button class="btn green" onclick="captureAndAnalyze()">فحص الوجه 👁️</button><p id="faceResult"></p><p id="metricsDisplay" style="font-size:10px;color:#0ff"></p></div>

<div id="panel-ai" class="panel">
<div style="text-align:center;margin-bottom:8px">
<span style="font-size:11px;color:#ffd700">🛡️ Sovereign AI Shield V12 HARDENED</span><br>
<span style="font-size:8px;color:#0ff">Offline • Anti-XSS • Anti-Unicode Bypass • Private</span>
</div>
<div style="background:#111;border:1px solid #ffd700;border-radius:8px;padding:8px;margin-bottom:8px">
<div style="font-size:10px;color:#ffd700;margin-bottom:4px">📊 إحصائيات العين:</div>
<div id="aiEyeStats" style="font-size:9px;color:#0f0">جاري التحميل...</div>
</div>
<input id="aiEyeInput" type="text" placeholder="اكتب نص لفحصه... جرب: <script>alert(1)</script> أو كلمة hack" style="width:100%;padding:10px;background:#000;border:1px solid #0f0;border-radius:6px;color:#0f0;font-size:11px;direction:ltr">
<button id="analyzeContentBtn" class="btn" style="background:#ffd700;color:#000;margin-top:6px">🔍 فحص بالذكاء السيادي</button>
<button id="aiEyeBtn" class="btn white" style="margin-top:4px">👁️ فتح النافذة المنبثقة</button>
<div id="aiEyeResult" class="log" style="min-height:120px;margin-top:6px"></div>
</div>

<div id="panel-ues" class="panel"><div id="sessions-list" class="log"></div><button class="btn green" onclick="startUES()">▶️ بدء جلسة</button><button class="btn white" onclick="listUES()">🔄 تحديث</button><div id="ues-result"></div></div>
<div id="panel-analytics" class="panel"><div id="stats-analytics"><p style="text-align:center;color:#0ff">📈 نظام الأرباح</p><p>الرصيد: <b id="profitBal">0</b></p></div></div>
</div>

<!-- Modal للعين -->
<div id="aiModal" class="hidden">
  <div class="modal-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="color:#ffd700;margin:0;font-size:14px">👁️ النافذة السيادية للعين</h3>
      <button id="aiCloseBtn" style="background:none;border:1px solid #ffd700;color:#ffd700;padding:2px 8px;cursor:pointer;border-radius:4px">إغلاق</button>
    </div>
    <div id="aiMessages" class="log" style="flex-grow:1;min-height:150px;margin-bottom:8px"></div>
    <input id="aiInput" type="text" placeholder="اكتب نص الفحص هنا..." style="width:100%;padding:8px;background:#111;color:#0f0;border:1px solid #ffd700;border-radius:6px;font-size:11px;direction:ltr">
    <button id="aiSendBtn" class="btn" style="background:#ffd700;color:#000;margin-top:6px">فحص فوري</button>
  </div>
</div>
</div>

<script type="module">
import { TarimAI } from '/static/ai-eye.js';
window.showTab = function(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    document.getElementById('t-' + name).classList.add('active');
};
window.sendTx = async function(amount) {
    try {
        let res = await fetch('/api/tx', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({amount})});
        let data = await res.json();
        document.getElementById('balance').innerText = data.balance;
        loadStats();
    } catch(e) {}
};
window.startCalibration = async function() {
    let res = await fetch('/api/calibrate', {method:'POST'});
    let data = await res.json();
    document.getElementById('calibResult').innerText = "تمت المعايرة بنجاح";
};
window.captureAndAnalyze = async function() {
    let video = document.getElementById('webcam');
    if (!video.srcObject) {
        try {
            let stream = await navigator.mediaDevices.getUserMedia({video:{width:320, height:240}});
            video.srcObject = stream;
        } catch(e) {
            document.getElementById('faceResult').innerText = "فشل تشغيل الكاميرا";
            return;
        }
    }
    let canvas = document.createElement('canvas');
    canvas.width = 160; canvas.height = 120;
    canvas.getContext('2d').drawImage(video, 0, 0, 160, 120);
    let dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    let res = await fetch('/api/vision', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({image:dataUrl})});
    let data = await res.json();
    document.getElementById('faceResult').innerText = "FPS: " + data.fps;
};
window.startUES = async function() {
    await fetch('/api/session', {method:'POST'});
    listUES();
};
window.listUES = async function() {
    let res = await fetch('/api/files');
    let data = await res.json();
    document.getElementById('sessions-list').innerHTML = data.files.join('<br>');
};
async function loadStats() {
    try {
        let res = await fetch('/stats');
        let data = await res.json();
        document.getElementById('device').innerText = data.device;
        document.getElementById('balance').innerText = data.balance;
        document.getElementById('profitBal').innerText = data.balance;
        document.getElementById('dag-size').innerText = data.dag_size;
        document.getElementById('fps').innerText = data.fps;
        if(window._tarimEye) {
            let stats = window._tarimEye.getStats();
            document.getElementById('aiEyeStats').innerHTML = `الزيارات: ${stats.totalVisits} | المهتم: ${stats.interested || 'لاشيء'} | الوقت: ${stats.timeSpent}ث`;
        }
    } catch(e) {}
}
setInterval(loadStats, 1000);
loadStats();
</script>
</body></html>"""

@app.route('/')
def index():
    return render_template_string(UNIFIED_HTML)

@app.route('/stats')
def stats():
    return jsonify({
        "device": DEVICE_ID,
        "fps": frame_counter.value,
        "balance": CRDT.value(),
        "dag_size": len(VERTICES)
    })

@app.route('/api/tx', methods=['POST'])
def tx():
    d = request.json or {}
    amt = d.get("amount", 0)
    ARENA.alloc(256)
    v = Vertex({"type":"transfer","amount":amt}, list(VERTICES.keys())[-2:], frame_counter.value)
    add_vertex(v.to_dict(), is_local=True)
    return jsonify({"balance": CRDT.value()})

@app.route('/api/calibrate', methods=['POST'])
def calibrate():
    log_event_db(time.time(), "calibrate", "INTEL")
    return jsonify({"ok": True})

@app.route('/api/vision', methods=['POST'])
def vision():
    with frame_lock:
        fps = frame_counter.value
    return jsonify({"ok": True, "fps": fps})

@app.route('/api/files')
def files():
    try:
        fs = os.listdir(DAILY_DIR)
        return jsonify({"files": fs[-10:]})
    except:
        return jsonify({"files": []})

@app.route('/api/session', methods=['POST'])
def session():
    save_json_safe(f"{SESSIONS_DIR}/{time.strftime('%Y%m%d_%H%M%S')}.json", {"start": time.time()})
    return jsonify({"ok": True})

if __name__ == '__main__':
    init_db()
    print(f"[*] TARIM OS V13 TITAN ON PORT {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
