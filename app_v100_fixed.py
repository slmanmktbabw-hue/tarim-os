from flask import Flask, request, jsonify, render_template_string
import json, os, glob, base64, io, sqlite3
from datetime import datetime
from PIL import Image

app = Flask(__name__)
DB_FILE = "database.db"
SESSION_FILE = "logs/sessions.jsonl"
SESSIONS_DIR = "sessions"
AUDIO_DIR = "sessions/audio"
MODEL_FILE = "model.json"

os.makedirs("logs", exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watch_time REAL,
        action TEXT,
        source TEXT,
        timestamp TEXT
    )
    """)
    conn.commit()
    conn.close()

def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f:
            return json.load(f).get("threshold", 20.3)
    except:
        return 20.3

def log_event_db(wt, action, source="AL-QALAH"):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO events (watch_time, action, source, timestamp) VALUES (?,?,?,?)",
            (wt, action, source, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB Log Error:", e)

UNIFIED_HTML = """<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TARIM OS V10.1 - AL-QALAH NEXUS</title>
<style>
* { box-sizing: border-box; }
body{background:#000;color:#0f0;font-family:monospace;margin:0;padding:8px;max-width:100%;overflow-x:hidden;}
.header{text-align:center;font-size:16px;font-weight:bold;border:2px solid #0f0;padding:8px;border-radius:10px;box-shadow:0 0 15px rgba(0,255,0,0.4);background:#001100;margin-bottom:6px;}
.flow{text-align:center;margin:6px 0;padding:6px;border:1px dashed #0f0;border-radius:6px;font-size:10px;line-height:1.4;background:#000500;}
.flow span{color:#ff0}

/* تنسيق التبويبات بصف أفقي واحد متناسق مع إمكانية التمرير بسلاسة على الشاشات الصغيرة */
.tabs{display:flex;gap:4px;margin:8px 0;overflow-x:auto;padding-bottom:2px;}
.tab{flex:1;min-width:65px;padding:8px 4px;border:1px solid #0f0;border-radius:6px;text-align:center;cursor:pointer;font-size:11px;background:#000;color:#0f0;white-space:nowrap;font-weight:bold;}
.tab.active{background:#0f0;color:#000;font-weight:bold;box-shadow:0 0 8px #0f0;}

.panel{border:2px solid #0f0;padding:10px;border-radius:10px;background:#000500;margin-top:6px;min-height:260px;}

.btn-group {display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;}
.btn{flex:1;min-width:110px;padding:8px 12px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:11px;text-align:center;}
.green{background:#0f0;color:#000;box-shadow:0 0 6px #0f0}
.white{background:#fff;color:#000}
.yellow{background:#ff0;color:#000}

.log{font-size:10px;opacity:.9;line-height:1.4;margin-top:6px;max-height:150px;overflow-y:auto;text-align:right;background:#001a00;padding:6px;border-radius:6px;border:1px solid #0a0}
.badge{display:inline-block;padding:2px 6px;border-radius:6px;font-size:9px;margin:2px}
.b-ues{background:#0a3;color:#fff}.b-tarim{background:#03a;color:#fff}
.input{width:100%;padding:8px;background:#000;color:#0f0;border:1px solid #0f0;border-radius:6px;font-family:monospace;margin-bottom:6px;}
.card{background:#001a00;padding:8px;border-radius:6px;margin:6px 0;border:1px solid #0f0}
video { display: block; margin: 6px auto; border: 2px solid #0f0; border-radius: 6px; max-width: 200px; width: 100%; }
</style>
</head>
<body>
<div class="header">🏰 TARIM OS V10.1 - الكطْلجيا الإمبراطورية 🧠👑<br><small style="font-size:9px;opacity:.8">Al-Qalah Core | Taizz, Yemen</small></div>
<div class="flow"><span>[ الكطْلجيا ]</span> ⇄ <span>[ قلعة تعز UES ]</span> ⇄ <span>[ TARIM AI ]</span></div>

<div class="tabs">
<div class="tab active" id="t-tarim" onclick="showTab('tarim')">🧠 الذكاء</div>
<div class="tab" id="t-ues" onclick="showTab('ues')">📹 UES</div>
<div class="tab" id="t-analytics" onclick="showTab('analytics')">📈 الأرباح</div>
<div class="tab" id="t-brain" onclick="showTab('brain')">💬 العقل</div>
<div class="tab" id="t-media" onclick="showTab('media')">👁️ الكطْلجيا</div>
</div>

<div id="panel-tarim" class="panel">
<div id="stats" style="font-size:11px">جاري تحميل العتبة الإمبراطورية...</div>
<div class="btn-group">
<button class="btn white" onclick="testAI(5)">اختبر تشتت (5s)</button>
<button class="btn green" onclick="testAI(25)">اختبر تركيز (25s)</button>
</div>
<div id="result" style="color:#ff0;margin-top:6px;font-size:10px"></div>
<div id="logs-tarim" class="log"></div>
</div>

<div id="panel-ues" class="panel" style="display:none">
<div style="font-size:11px">📹 UES-Gateway v2.0 - حلقة جلسات 8:19</div>
<div id="sessions-list" class="log" style="margin:6px 0">جاري جلب الملفات...</div>
<div class="btn-group">
<button class="btn green" onclick="startUES()">▶️ بدء جلسة</button>
<button class="btn white" onclick="listUES()">🔄 تحديث</button>
<button class="btn yellow" onclick="feedToAI()">🧠 تغذية</button>
</div>
<div id="ues-result" style="color:#0ff;margin-top:6px;font-size:10px"></div>
</div>

<div id="panel-analytics" class="panel" style="display:none">
<h3 style="margin:0 0 6px 0;font-size:13px;">📊 لوحة أرباح وأداء الكطْلجيا</h3>
<div id="stats-analytics" class="card" style="font-size:10px;">جاري الحساب من قاعدة البيانات...</div>
<div id="top-videos" class="log">سجلات الأداء العالي ستظهر هنا</div>
</div>

<div id="panel-brain" class="panel" style="display:none">
<h3 style="margin:0 0 6px 0;font-size:13px;">💬 TARIM BRAIN V10</h3>
<div id="brain-chat" class="log" style="height:120px"></div>
<input id="brain-input" class="input" placeholder="اسأل عن الأرباح، الـ Retention...">
<button class="btn green" onclick="askBrain()" style="width:100%;">إرسال التوجيه</button>
</div>

<div id="panel-media" class="panel" style="display:none">
<h3 style="margin:0 0 6px 0;font-size:13px;">👁️ وحدة الكطْلجيا والترصد الحي</h3>
<div class="card">
    <video id="webcam" autoplay playsinline></video>
    <button class="btn green" onclick="captureAndAnalyze()" style="width:100%;margin-top:4px;">فحص تركيز الكطْلجيا 👁️</button>
    <p id="faceResult" style="color:#ff0;font-size:10px;margin:4px 0 0 0;">الحالة: جاهز للتتبع ✅</p>
</div>
<div class="card">
    <button id="recordBtn" class="btn yellow" onclick="toggleRecording()" style="width:100%;">🎙️ تسجيل صوتي</button>
    <p id="micResult" style="color:#0ff;font-size:10px;margin:4px 0 0 0;">الميكروفون: متوقف</p>
</div>
</div>

<script>
let lastWatchTime = 0;
function showTab(name){
 document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
 document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
 document.getElementById('panel-'+name).style.display='block';
 document.getElementById('t-'+name).classList.add('active');
 if(name=='ues') listUES();
 if(name=='analytics') loadAnalytics();
 if(name=='media') initCamera();
}
async function loadStats(){
 let r=await fetch('/stats'); let d=await r.json();
 document.getElementById('stats').innerHTML=`Threshold=<b>${d.threshold}s</b> | الأحداث: <b>${d.total}</b> <span class="badge b-tarim">V10.1</span>`;
 document.getElementById('logs-tarim').innerHTML=d.last.map(e=>`${e.watch_time}s → ${e.action} <span class="badge ${e.source.includes('UES')?'b-ues':'b-tarim'}">${e.source}</span> ${e.timestamp?.slice(11,19)||''}`).join('<br>');
}
async function testAI(sec){
 let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:sec, source:'AL-QALAH'})});
 let d=await r.json();
 document.getElementById('result').innerHTML=`القرار: ${d.action} | العتبة: ${d.threshold_used}s`;
 lastWatchTime=sec; loadStats();
}
async function listUES(){
 let r=await fetch('/list_sessions'); let d=await r.json();
 let html = d.sessions.length? d.sessions.map(s=>`🎬 ${s.name} - ${s.duration} - ${s.watch_time}s`).join('<br>') : 'لا توجد جلسات مسجلة';
 document.getElementById('sessions-list').innerHTML=html;
 if(d.sessions.length) lastWatchTime=d.sessions[0].watch_time;
}
async function startUES(){
 let r=await fetch('/start_session',{method:'POST'}); let d=await r.json();
 document.getElementById('ues-result').innerHTML=`✅ بدأت الجلسة ${d.id} | الوقت: ${d.watch_time}s`;
 listUES();
}
async function feedToAI(){
 if(!lastWatchTime) return alert('الرجاء بدء جلسة أولاً!');
 let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:lastWatchTime, source:'UES-AlQalah'})});
 let d=await r.json();
 document.getElementById('ues-result').innerHTML=`🧠 تم التغذية: ${lastWatchTime}s → ${d.action}`;
 loadStats();
}
async function loadAnalytics(){
 let r=await fetch('/stats'); let d=await r.json();
 let retention = d.total > 0? ((d.last.filter(e=>e.watch_time>=d.threshold).length / d.total)*100).toFixed(1) : 0;
 let est_revenue = (d.total * 0.007).toFixed(2);
 document.getElementById('stats-analytics').innerHTML =`<b>Retention:</b> ${retention}% | <b>SQLite:</b> ${d.total}<br><b>العائد المتوقع:</b> $${est_revenue} | <b>الحالة:</b> متصل 🛡️`;
 let top = d.last.filter(e=>e.watch_time>=d.threshold).slice(0,5);
 document.getElementById('top-videos').innerHTML = top.length? '<b>الأحداث الفائقة:</b><br>' + top.map(e=>`🔥 ${e.watch_time}s - ${e.source}`).join('<br>') : 'لا توجد بيانات كافية';
}
async function askBrain(){
 let q = document.getElementById('brain-input').value;
 if(!q) return;
 document.getElementById('brain-chat').innerHTML += `<br><b>أنت:</b> ${q}`;
 document.getElementById('brain-input').value = '';
 let r=await fetch('/ai_brain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:q})});
 let d=await r.json();
 document.getElementById('brain-chat').innerHTML += `<br><span style="color:#ff0"><b>TARIM:</b> ${d.response}</span>`;
 document.getElementById('brain-chat').scrollTop = document.getElementById('brain-chat').scrollHeight;
}
function initCamera(){
 navigator.mediaDevices.getUserMedia({ video: true, audio: false })
   .then(stream => { document.getElementById('webcam').srcObject = stream; })
   .catch(err => { document.getElementById('faceResult').innerText = 'خطأ الكاميرا: ' + err; });
}
function captureAndAnalyze(){
 const video = document.getElementById('webcam');
 const canvas = document.createElement('canvas');
 canvas.width = video.videoWidth || 200;
 canvas.height = video.videoHeight || 150;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
 const imageB64 = canvas.toDataURL('image/jpeg');
 fetch('/api/analyze_camera', {method: 'POST',headers: { 'Content-Type': 'application/json' },body: JSON.stringify({ image: imageB64 })})
.then(res => res.json()).then(data => {
    document.getElementById('faceResult').innerText = `👁️ ${data.status}`;
 });
}
let mediaRecorder; let audioChunks = [];
async function toggleRecording(){
 const btn = document.getElementById('recordBtn');
 if(!mediaRecorder || mediaRecorder.state === "inactive"){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream); audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData(); formData.append('audio', blob, 'mic.wav');
        fetch('/api/upload_audio', { method: 'POST', body: formData })
           .then(res => res.json()).then(data => { document.getElementById('micResult').innerText = `✅ تم حفظ الصوت: ${data.file}`; });
    };
    mediaRecorder.start(); btn.innerText = "🛑 إيقاف وحفظ";
    document.getElementById('micResult').innerText = "جاري التقاط الصوت...";
 } else { mediaRecorder.stop(); btn.innerText = "🎙️ تسجيل صوتي"; }
}
loadStats(); listUES(); setInterval(loadStats,5000);
</script>
</body>
</html>"""

@app.route('/')
def home(): return render_template_string(UNIFIED_HTML)

@app.route('/stats')
def stats():
    th = load_threshold(); ev = []
    try:
        conn = sqlite3.connect(DB_FILE); conn.row_factory = sqlite3.Row; cursor = conn.cursor()
        cursor.execute("SELECT watch_time, action, source, timestamp FROM events ORDER BY id DESC LIMIT 25")
        rows = cursor.fetchall()
        for r in rows: ev.append({"watch_time": r["watch_time"], "action": r["action"], "source": r["source"], "timestamp": r["timestamp"]})
        cursor.execute("SELECT COUNT(*) FROM events"); total = cursor.fetchone()[0]; conn.close()
    except: total = 0
    return jsonify({"threshold": th, "total": total, "last": ev})

@app.route('/get_next_video', methods=['POST'])
def get_next_video():
    data = request.json or {}; wt = float(data.get('watch_time', 0)); src = data.get('source', 'AL-QALAH'); th = load_threshold()
    action = "split_screen_ai" if wt >= th else "pause_video_wandering"
    log_event_db(wt, action, src)
    return jsonify({"action": action, "threshold_used": th, "source": src})

@app.route('/start_session', methods=['POST'])
def start_session():
    os.makedirs(SESSIONS_DIR, exist_ok=True); sid = datetime.now().strftime("%Y%m%d_%H%M%S"); wt = round(21 + (os.urandom(1)[0] % 12), 1)
    session_data = {"name": f"alqalah_session_{sid}.mp4", "id": sid, "duration": "8:19", "watch_time": wt, "date": datetime.now().isoformat()}
    with open(f"{SESSIONS_DIR}/{sid}.json", "w", encoding='utf-8') as f: json.dump(session_data, f, ensure_ascii=False)
    with open(SESSION_FILE, "a", encoding='utf-8') as f: f.write(json.dumps(session_data, ensure_ascii=False) + "\n")
    return jsonify({"status": "Al-Qalah Session Started", "id": sid, "duration": "8:19", "watch_time": wt})

@app.route('/list_sessions')
def list_sessions():
    os.makedirs(SESSIONS_DIR, exist_ok=True); sessions = []
    for path in glob.glob(f"{SESSIONS_DIR}/*.json"):
        try:
            with open(path, encoding='utf-8') as f: sessions.append(json.load(f))
        except: pass
    sessions.sort(key=lambda x: x.get('date', ''), reverse=True)
    return jsonify({"sessions": sessions[:20]})

@app.route('/ai_brain', methods=['POST'])
def ai_brain():
    data = request.get_json() or {}; user_text = data.get('text', '').lower(); th = load_threshold()
    try: conn = sqlite3.connect(DB_FILE); cursor = conn.cursor(); cursor.execute("SELECT COUNT(*) FROM events"); total_db = cursor.fetchone()[0]; conn.close()
    except: total_db = 0
    if "كم" in user_text or "عدد" in user_text: answer = f"إجمالي الأحداث المسجلة هو {total_db} حدثاً نشطاً."
    elif "أرباح" in user_text or "فلوس" in user_text: 
        revenue = round(total_db * 0.007, 2)
        answer = f"الأرباح التقديرية الحالية تقارب ${revenue}."
    else: answer = f"استقبلت توجيهك: '{user_text}'. النظام يعمل بكامل طاقته."
    return jsonify({"response": answer})

@app.route('/api/analyze_camera', methods=['POST'])
def api_analyze_camera():
    try:
        data = request.json or {}; image_b64 = data.get('image', '')
        if ',' in image_b64: image_b64 = image_b64.split(',')[1]
        img_data = base64.b64decode(image_b64); image = Image.open(io.BytesIO(img_data)); size = image.size
        status = "مركز ومنتبه 🟢"
        log_event_db(load_threshold(), "alqalah_eye_focus_ok", "AL-QALAH_CAM")
        return jsonify({"success": True, "status": status, "size": str(size)})
    except Exception as e: return jsonify({"success": False, "status": "خطأ في معالجة الكاميرا ❌"})

@app.route('/api/upload_audio', methods=['POST'])
def api_upload_audio():
    try:
        audio_file = request.files['audio']; filename = f"alqalah_audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
        filepath = os.path.join(AUDIO_DIR, filename); audio_file.save(filepath)
        log_event_db(load_threshold(), "alqalah_audio_processed", "AL-QALAH_MIC")
        return jsonify({"success": True, "file": filename})
    except Exception as e: return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    init_db()
    th = load_threshold()
    print("="*60)
    print(f"TARIM OS V10.1 - AL-QALAH NEXUS (Taizz, Yemen)")
    print(f"Threshold={th} | Port=5001 | 5 Tabs Active")
    print("="*60)
    app.run(host='0.0.0.0', port=5001, debug=False)

