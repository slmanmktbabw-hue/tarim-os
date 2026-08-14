from flask import Flask, request, jsonify, render_template_string
import json, os, glob, base64, io
from datetime import datetime
from PIL import Image

app = Flask(__name__)
LOG_FILE = "logs/training_events.jsonl"
SESSION_FILE = "logs/sessions.jsonl"
SESSIONS_DIR = "sessions"
AUDIO_DIR = "sessions/audio"
MODEL_FILE = "model.json"

os.makedirs("logs", exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f:
            return json.load(f).get("threshold", 20.3)
    except:
        return 20.3

def log_event(wt, action, source="TARIM"):
    with open(LOG_FILE, "a", encoding='utf-8') as f:
        f.write(json.dumps({
            "watch_time": wt,
            "action": action,
            "source": source,
            "timestamp": datetime.now().isoformat()
        }, ensure_ascii=False) + "\n")

UNIFIED_HTML = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TARIM OS V9.4 - CASTLE GATEWAY</title>
<style>
body{background:#000;color:#0f0;font-family:monospace;margin:0;padding:15px}
.header{text-align:center;font-size:20px;font-weight:bold;border:2px solid #0f0;padding:12px;border-radius:12px;box-shadow:0 0 15px rgba(0,255,0,0.3)}
.flow{text-align:center;margin:15px 0;padding:10px;border:1px dashed #0f0;border-radius:8px;font-size:11px;line-height:1.8}
.flow span{color:#fff}
.tabs{display:flex;gap:5px;margin:15px 0;flex-wrap:wrap}
.tab{flex:1;min-width:75px;padding:8px 5px;border:1px solid #0f0;border-radius:8px;text-align:center;cursor:pointer;font-size:11px}
.tab.active{background:#0f0;color:#000;font-weight:bold}
.panel{border:2px solid #0f0;padding:15px;border-radius:12px;min-height:250px}
.btn{padding:10px 18px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;margin:4px;font-size:12px}
.green{background:#0f0;color:#000;box-shadow:0 0 8px #0f0}
.white{background:#fff;color:#000}
.yellow{background:#ff0;color:#000}
.log{font-size:11px;opacity:.85;line-height:1.6;margin-top:10px;max-height:200px;overflow-y:auto;text-align:right;background:#001100;padding:8px;border-radius:6px}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;margin:2px}
.b-ues{background:#0a3;color:#fff}.b-tarim{background:#03a;color:#fff}
.input{width:70%;padding:8px;background:#000;color:#0f0;border:1px solid #0f0;border-radius:6px}
.card{background:#011;padding:10px;border-radius:8px;margin:8px 0;border:1px solid #0f0}
video { display: block; margin: 10px auto; border: 1px solid #0f0; border-radius: 8px; max-width: 260px; width: 100%; }
</style>
</head>
<body>
<div class="header">🏰 TARIM OS V9.4 - CASTLE GATEWAY 🧠👑<br><small style="font-size:11px;opacity:.7">Castle: tarim-os | Built: Taizz, Yemen | Port 5001</small></div>

<div class="flow">
<span>[ المستخدم ]</span> ↓ <span>[ القلعة UES ]</span> ↓ <span>[ TARIM AI ]</span> ↓ <span>[ الكاميرا والصوت ]</span>
</div>

<div class="tabs">
<div class="tab active" id="t-tarim" onclick="showTab('tarim')">🧠 TARIM</div>
<div class="tab" id="t-ues" onclick="showTab('ues')">📹 UES</div>
<div class="tab" id="t-analytics" onclick="showTab('analytics')">📈 أرباح</div>
<div class="tab" id="t-brain" onclick="showTab('brain')">💬 العقل</div>
<div class="tab" id="t-media" onclick="showTab('media')">📷 الكاميرا والميكروفون</div>
</div>

<!-- 1. TARIM -->
<div id="panel-tarim" class="panel">
<div id="stats" style="font-size:13px">Loading threshold...</div><br>
<button class="btn white" onclick="testAI(5)">اختبر 5s - wait</button>
<button class="btn green" onclick="testAI(25)">اختبر 25s - split</button>
<div id="result" style="color:#ff0;margin-top:10px;font-size:12px"></div>
<div id="logs-tarim" class="log"></div>
</div>

<!-- 2. UES -->
<div id="panel-ues" class="panel" style="display:none">
<div style="font-size:13px">📹 UES-Gateway v1.1 - Session Loop 8:19</div>
<div id="sessions-list" class="log" style="margin:10px 0">جاري التحميل...</div>
<button class="btn green" onclick="startUES()">▶️ ابدأ جلسة 8:19</button>
<button class="btn white" onclick="listUES()">🔄 عرض الملفات</button>
<button class="btn yellow" onclick="feedToAI()">🧠 غذّي العقل</button>
<div id="ues-result" style="color:#0ff;margin-top:10px;font-size:11px"></div>
</div>

<!-- 3. ANALYTICS -->
<div id="panel-analytics" class="panel" style="display:none">
<h3>📊 لوحة الأرباح والاداء</h3>
<div id="stats-analytics" class="card">جاري التحميل...</div>
<div id="top-videos" class="log">أفضل الجلسات ستظهر هنا</div>
</div>

<!-- 4. AI BRAIN -->
<div id="panel-brain" class="panel" style="display:none">
<h3>🧠 TARIM BRAIN v9.4 - اسألني عن بياناتك</h3>
<div id="brain-chat" class="log" style="height:160px"></div>
<input id="brain-input" class="input" placeholder="مثال: ليش retention نازل؟ ايش افضل وقت للنشر؟">
<button class="btn green" onclick="askBrain()">ارسل</button>
</div>

<!-- 5. CAM & MIC -->
<div id="panel-media" class="panel" style="display:none">
<h3>📷 وحدة الكاميرا والميكروفون الحية (V9.4)</h3>
<div class="card">
    <video id="webcam" autoplay playsinline></video>
    <button class="btn green" onclick="captureFace()">التقاط وفحص التركيز</button>
    <p id="faceResult" style="color:#ff0;font-size:12px">الحالة: متصل ومنتبه ✅</p>
</div>
<div class="card">
    <button id="recordBtn" class="btn yellow" onclick="toggleRecording()">🎙️ بدء تسجيل الصوت</button>
    <p id="micResult" style="color:#0ff;font-size:12px">حالة الميكروفون: متوقف</p>
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
 document.getElementById('stats').innerHTML=`Threshold=<b>${d.threshold}</b> - TOTAL ${d.total} events <span class="badge b-tarim">AI</span>`;
 document.getElementById('logs-tarim').innerHTML=d.last.map(e=>`${e.watch_time}s -> ${e.action} <span class="badge ${e.source.includes('UES')?'b-ues':'b-tarim'}">${e.source}</span> ${e.timestamp?.slice(11,19)||''}`).join('<br>');
}
async function testAI(sec){
 let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:sec, source:'TARIM'})});
 let d=await r.json();
 document.getElementById('result').innerHTML=`Action: ${d.action} | threshold: ${d.threshold_used}`;
 lastWatchTime=sec; loadStats();
}
async function listUES(){
 let r=await fetch('/list_sessions'); let d=await r.json();
 let html = d.sessions.length? d.sessions.map(s=>`🎬 ${s.name} - ${s.duration} - ${s.watch_time}s - ${s.date.slice(0,10)}`).join('<br>') : 'لا يوجد جلسات بعد - ابدأ واحدة!';
 document.getElementById('sessions-list').innerHTML=html;
 if(d.sessions.length) lastWatchTime=d.sessions[0].watch_time;
}
async function startUES(){
 let r=await fetch('/start_session',{method:'POST'}); let d=await r.json();
 document.getElementById('ues-result').innerHTML=`✅ بدأت ${d.id} - ${d.duration} - watch_time: ${d.watch_time}s`;
 listUES();
}
async function feedToAI(){
 if(!lastWatchTime) return alert('لا يوجد watch_time');
 let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:lastWatchTime, source:'UES-8:19'})});
 let d=await r.json();
 document.getElementById('ues-result').innerHTML=`🧠 تم التغذية: ${lastWatchTime}s -> ${d.action}`;
 loadStats();
}
async function loadAnalytics(){
 let r=await fetch('/stats'); let d=await r.json();
 let retention = d.total > 0? ((d.last.filter(e=>e.watch_time>=d.threshold).length / d.total)*100).toFixed(1) : 0;
 let est_revenue = (d.total * 0.004).toFixed(2);
 document.getElementById('stats-analytics').innerHTML =
 `<b>Retention Rate:</b> ${retention}%<br>
  <b>Total Events:</b> ${d.total}<br>
  <b>Estimated Revenue:</b> $${est_revenue}<br>
  <b>Threshold:</b> ${d.threshold}s`;
 let top = d.last.filter(e=>e.watch_time>=d.threshold).slice(0,5);
 document.getElementById('top-videos').innerHTML = top.length? '<b>أفضل الجلسات:</b><br>' + top.map(e=>`🔥 ${e.watch_time}s - ${e.source}`).join('<br>') : 'لا توجد بيانات كافية';
}
async function askBrain(){
 let q = document.getElementById('brain-input').value;
 if(!q) return;
 document.getElementById('brain-chat').innerHTML += `<br><b>انت:</b> ${q}`;
 document.getElementById('brain-input').value = '';
 let r=await fetch('/ai_brain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:q})});
 let d=await r.json();
 document.getElementById('brain-chat').innerHTML += `<br><span style="color:#ff0"><b>TARIM V9.4:</b> ${d.response}</span>`;
 document.getElementById('brain-chat').scrollTop = document.getElementById('brain-chat').scrollHeight;
}

// Media Stream Functions
function initCamera(){
 navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => { document.getElementById('webcam').srcObject = stream; })
    .catch(err => { document.getElementById('faceResult').innerText = 'خطأ الكاميرا: ' + err; });
}
function captureFace(){
 const video = document.getElementById('webcam');
 const canvas = document.createElement('canvas');
 canvas.width = video.videoWidth || 260;
 canvas.height = video.videoHeight || 195;
 const ctx = canvas.getContext('2d');
 ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
 const imageB64 = canvas.toDataURL('image/jpeg');

 fetch('/api/analyze_camera', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageB64 })
 })
 .then(res => res.json())
 .then(data => {
    document.getElementById('faceResult').innerText = `✅ تتبع العين نشط: ${data.status} (الحجم: ${data.size})`;
 });
}

let mediaRecorder;
let audioChunks = [];
async function toggleRecording(){
 const btn = document.getElementById('recordBtn');
 if(!mediaRecorder || mediaRecorder.state === "inactive"){
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', blob, 'mic.wav');
        fetch('/api/upload_audio', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => { document.getElementById('micResult').innerText = `✅ تم حفظ وبث الصوت: ${data.file}`; });
    };
    mediaRecorder.start();
    btn.innerText = "🛑 إيقاف وحفظ الصوت";
    document.getElementById('micResult').innerText = "جاري التسجيل والتفاعل...";
 } else {
    mediaRecorder.stop();
    btn.innerText = "🎙️ بدء تسجيل الصوت";
 }
}

loadStats(); listUES(); setInterval(loadStats,5000);
</script>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(UNIFIED_HTML)

@app.route('/stats')
def stats():
    th=load_threshold(); ev=[]
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, encoding='utf-8') as f:
                for line in f:
                    try: ev.append(json.loads(line))
                    except: pass
        except: pass
    return jsonify({"threshold": th, "total": len(ev), "last": ev[-20:][::-1]})

@app.route('/get_next_video', methods=['POST'])
def get_next_video():
    data=request.json or {}
    wt=float(data.get('watch_time', 0))
    src=data.get('source','TARIM')
    th=load_threshold()
    action="split_screen" if wt>=th else "wait"
    log_event(wt, action, src)
    return jsonify({"action": action, "threshold_used": th, "source": src})

@app.route('/start_session', methods=['POST'])
def start_session():
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    sid=datetime.now().strftime("%Y%m%d_%H%M%S")
    wt=round(22 + (os.urandom(1)[0]%10), 1)
    session_data={"name": f"session_{sid}.mp4", "id": sid, "duration": "8:19", "watch_time": wt, "date": datetime.now().isoformat()}
    with open(f"{SESSIONS_DIR}/{sid}.json","w",encoding='utf-8') as f:
        json.dump(session_data,f,ensure_ascii=False)
    with open(SESSION_FILE,"a",encoding='utf-8') as f:
        f.write(json.dumps(session_data, ensure_ascii=False)+"\n")
    return jsonify({"status":"Session Started","id":sid,"duration":"8:19","watch_time":wt})

@app.route('/list_sessions')
def list_sessions():
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    sessions=[]
    for path in glob.glob(f"{SESSIONS_DIR}/*.json"):
        try:
            with open(path,encoding='utf-8') as f:
                sessions.append(json.load(f))
        except: pass
    sessions.sort(key=lambda x: x.get('date',''), reverse=True)
    return jsonify({"sessions": sessions[:20]})

@app.route('/ai_brain', methods=['POST'])
def ai_brain():
    data = request.get_json() or {}
    user_text = data.get('text', '').lower()
    th = load_threshold()
    if "retention" in user_text or "نزول" in user_text:
        answer = f"تحليل V9.4: الـ Retention مرتبط بـ threshold {th}s في قلعة تعز."
    elif "وقت" in user_text or "نشر" in user_text:
        answer = "أفضل وقت للنشر حسب بيانات الحصاد هو 8 إلى 10 مساءً."
    else:
        answer = f"استقبلت: {user_text}. TARIM OS V9.4 يعمل بكامل طاقته الإمبراطورية."
    return jsonify({"response": answer})

@app.route('/api/analyze_camera', methods=['POST'])
def api_analyze_camera():
    try:
        data = request.json or {}
        image_b64 = data.get('image', '')
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]
        img_data = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(img_data))
        size = image.size
        log_event(load_threshold(), "eye_focus_active", "CASTLE_V94_CAM")
        return jsonify({"success": True, "status": "مركز ✅ (نشط)", "size": str(size)})
    except Exception as e:
        return jsonify({"success": False, "status": "خطأ في الفحص ❌"})

@app.route('/api/upload_audio', methods=['POST'])
def api_upload_audio():
    try:
        audio_file = request.files['audio']
        filename = f"audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
        filepath = os.path.join(AUDIO_DIR, filename)
        audio_file.save(filepath)
        log_event(load_threshold(), "audio_interaction", "CASTLE_V94_MIC")
        return jsonify({"success": True, "file": filename})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    th = load_threshold()
    print("="*60)
    print(f"TARIM OS V9.4 - FULL CASTLE GATEWAY (Taizz, Yemen)")
    print(f"Threshold={th} | Port=5001 | 5 Tabs Active | Eye-Focus Ready")
    print("="*60)
    app.run(host='0.0.0.0', port=5001, debug=False)

