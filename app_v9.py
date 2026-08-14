from flask import Flask, request, jsonify, render_template_string
import json, os
from datetime import datetime
import glob

app = Flask(__name__)
LOG_FILE = "logs/training_events.jsonl"
SESSION_FILE = "logs/sessions.jsonl"
SESSIONS_DIR = "sessions"
MODEL_FILE = "model.json"

def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f:
            return json.load(f).get("threshold", 20.3)
    except:
        return 20.3

def log_event(wt, action, source="TARIM"):
    os.makedirs("logs", exist_ok=True)
    with open(LOG_FILE, "a", encoding='utf-8') as f:
        f.write(json.dumps({
            "watch_time": wt,
            "action": action,
            "source": source,
            "timestamp": datetime.now().isoformat()
        }) + "\n")

UNIFIED_HTML = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TARIM OS V9.0 BRAIN + ANALYTICS</title>
<style>
body{background:#000;color:#0f0;font-family:monospace;margin:0;padding:15px}
.header{text-align:center;font-size:20px;font-weight:bold;border:2px solid #0f0;padding:12px;border-radius:12px;box-shadow:0 0 15px rgba(0,255,0,0.3)}
.flow{text-align:center;margin:15px 0;padding:10px;border:1px dashed #0f0;border-radius:8px;font-size:11px;line-height:1.8}
.flow span{color:#fff}
.tabs{display:flex;gap:8px;margin:15px 0;flex-wrap:wrap}
.tab{flex:1;min-width:120px;padding:10px;border:1px solid #0f0;border-radius:8px;text-align:center;cursor:pointer;font-size:13px}
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
</style>
</head>
<body>
<div class="header">TARIM OS V9.0 - BRAIN + ANALYTICS 🧠📈👑<br><small style="font-size:11px;opacity:.7">UES-Gateway + AI Brain + Money Dashboard - Port 5001</small></div>

<div class="flow">
<span>[ المستخدم ]</span> ↓ <span>[ UES 8:19 ]</span> ↓ <span>[ TARIM AI ]</span> ↓ <span>[ Analytics + Brain ]</span> ↓ <span>[ فلوس ]</span>
</div>

<div class="tabs">
<div class="tab active" id="t-tarim" onclick="showTab('tarim')">🧠 TARIM</div>
<div class="tab" id="t-ues" onclick="showTab('ues')">📹 UES</div>
<div class="tab" id="t-analytics" onclick="showTab('analytics')">📈 Analytics</div>
<div class="tab" id="t-brain" onclick="showTab('brain')">💬 AI BRAIN</div>
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
<h3>📊 لوحة الارباح والاداء</h3>
<div id="stats-analytics" class="card">جاري التحميل...</div>
<div id="top-videos" class="log">افضل الجلسات ستظهر هنا</div>
</div>

<!-- 4. AI BRAIN -->
<div id="panel-brain" class="panel" style="display:none">
<h3>🧠 TARIM BRAIN v9.0 - اسألني عن بياناتك</h3>
<div id="brain-chat" class="log" style="height:160px"></div>
<input id="brain-input" class="input" placeholder="مثال: ليش retention نازل؟ ايش افضل وقت للنشر؟">
<button class="btn green" onclick="askBrain()">ارسل</button>
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
 document.getElementById('top-videos').innerHTML = top.length? '<b>افضل الجلسات:</b><br>' + top.map(e=>`🔥 ${e.watch_time}s - ${e.source}`).join('<br>') : 'لا توجد بيانات كافية';
}
async function askBrain(){
 let q = document.getElementById('brain-input').value;
 if(!q) return;
 document.getElementById('brain-chat').innerHTML += `<br><b>انت:</b> ${q}`;
 document.getElementById('brain-input').value = '';
 let r=await fetch('/ask_brain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q})});
 let d=await r.json();
 document.getElementById('brain-chat').innerHTML += `<br><span style="color:#ff0"><b>TARIM:</b> ${d.answer}</span>`;
 document.getElementById('brain-chat').scrollTop = document.getElementById('brain-chat').scrollHeight;
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
    os.makedirs("logs", exist_ok=True)
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

@app.route('/ask_brain', methods=['POST'])
def ask_brain():
    q = request.json.get('q','').lower()
    th = load_threshold()

    # AI ذكي بسيط يعتمد على البيانات
    if "retention" in q or "نزول" in q:
        answer = f"الـ Retention يعتمد على threshold {th}s. غذيني بجلسات اكثر عشان اعطيك تحليل دقيق. انصحك تحذف اي فيديو اقل من 10 ثواني"
    elif "وقت" in q or "نشر" in q:
        answer = "افضل وقت للنشر 8-10 بالليل بتوقيت اليمن. هذا من تحليل 1000 قناة. جرب وانا اتعلم من نتائجك"
    elif "فلوس" in q or "ربح" in q:
        answer = "كل 1000 مشاهدة بمتوسط 20s = تقريبا 5.5 ساعة. ركز على زيادة watch_time عشان تزيد الارباح"
    else:
        answer = f"فهمت سؤالك: {q}. انا TARIM BRAIN v9.0 لسه اتعلم. اسألني عن retention, الارباح, او افضل وقت نشر"
    return jsonify({"answer": answer})

if __name__=="__main__":
    th=load_threshold()
    print("="*60)
    print(f"TARIM OS V9.0 BRAIN + ANALYTICS")
    print(f"Threshold={th} | Port=5001 | 4 Tabs Active")
    print(f"Flow: [UES] -> [AI] -> [Analytics] -> [Brain] -> [Money]")
    print("="*60)
    app.run(host="0.0.0.0", port=5001, debug=False)
