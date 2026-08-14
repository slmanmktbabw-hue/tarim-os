from flask import Flask, request, jsonify, render_template_string
import json, os, glob
from datetime import datetime
app = Flask(__name__)
LOG_FILE = "logs/training_events.jsonl"
SESSIONS_DIR = "sessions"
MODEL_FILE = "model.json"
def load_threshold():
 try:
  with open(MODEL_FILE, encoding='utf-8') as f: return json.load(f).get("threshold", 20.3)
 except: return 20.3
def log_event(wt, act, src="TARIM"):
 os.makedirs("logs", exist_ok=True)
 with open(LOG_FILE, "a", encoding='utf-8') as f: f.write(json.dumps({"watch_time": wt, "action": act, "source": src, "timestamp": datetime.now().isoformat()})+"\n")
HTML = """<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TARIM V8.1 UNIFIED</title><style>body{background:#000;color:#0f0;font-family:monospace;padding:15px}.header{text-align:center;border:2px solid #0f0;padding:10px;border-radius:10px}.tabs{display:flex;gap:6px;margin:12px 0}.tab{flex:1;padding:8px;border:1px solid #0f0;border-radius:8px;text-align:center;cursor:pointer}.tab.active{background:#0f0;color:#000}.panel{border:2px solid #0f0;padding:12px;border-radius:10px}.btn{padding:8px 14px;border:none;border-radius:6px;font-weight:bold;margin:3px}.green{background:#0f0;color:#000}.white{background:#fff;color:#000}.yellow{background:#ff0;color:#000}.log{font-size:11px;margin-top:8px}</style></head><body><div class="header">TARIM OS V8.1 UNIFIED - UES + AI<br><small>One Port 5001</small></div><div class="tabs"><div class="tab active" onclick="showTab('tarim')">🧠 TARIM</div><div class="tab" onclick="showTab('ues')">📹 UES 8:19</div></div><div id="panel-tarim" class="panel"><div id="stats">Loading...</div><br><button class="btn white" onclick="testAI(5)">اختبر 5s</button><button class="btn green" onclick="testAI(25)">اختبر 25s</button><div id="result"></div><div id="logs-tarim" class="log"></div></div><div id="panel-ues" class="panel" style="display:none"><div id="sessions-list">...</div><br><button class="btn green" onclick="startUES()">ابدأ 8:19</button><button class="btn white" onclick="listUES()">عرض الملفات</button><button class="btn yellow" onclick="feedToAI()">غذّي العقل</button><div id="ues-result"></div></div><script>let lastWT=0;function showTab(n){document.querySelectorAll('.panel').forEach(p=>p.style.display='none');document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.getElementById('panel-'+n).style.display='block';event.target.classList.add('active');}async function loadStats(){let r=await fetch('/stats');let d=await r.json();document.getElementById('stats').innerHTML=`Threshold=${d.threshold} - TOTAL ${d.total}`;document.getElementById('logs-tarim').innerHTML=d.last.map(e=>`${e.watch_time}s -> ${e.action} [${e.source}]`).join('<br>');}async function testAI(s){let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:s,source:'TARIM'})});let d=await r.json();document.getElementById('result').innerHTML=d.action;lastWT=s;loadStats();}async function listUES(){let r=await fetch('/list_sessions');let d=await r.json();document.getElementById('sessions-list').innerHTML=d.sessions.length?d.sessions.map(s=>`${s.name} - ${s.watch_time}s`).join('<br>'):'لا يوجد';if(d.sessions.length)lastWT=d.sessions[0].watch_time;}async function startUES(){let r=await fetch('/start_session',{method:'POST'});let d=await r.json();document.getElementById('ues-result').innerHTML='بدأت '+d.id;listUES();}async function feedToAI(){let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:lastWT,source:'UES-8:19'})});let d=await r.json();document.getElementById('ues-result').innerHTML='غذيت: '+lastWT+'s -> '+d.action;loadStats();}loadStats();</script></body></html>"""
@app.route('/')
def home(): return render_template_string(HTML)
@app.route('/stats')
def stats():
 th=load_threshold();ev=[]
 if os.path.exists(LOG_FILE):
  with open(LOG_FILE,encoding='utf-8') as f:
   for l in f:
    try: ev.append(json.loads(l))
    except: pass
 return jsonify({"threshold":th,"total":len(ev),"last":ev[-10:][::-1]})
@app.route('/get_next_video',methods=['POST'])
def get_next():
 d=request.json or {};wt=float(d.get('watch_time',0));src=d.get('source','TARIM');th=load_threshold();act="split_screen" if wt>=th else "wait";log_event(wt,act,src);return jsonify({"action":act,"threshold_used":th})
@app.route('/start_session',methods=['POST'])
def start_s():
 os.makedirs(SESSIONS_DIR,exist_ok=True);os.makedirs("logs",exist_ok=True);sid=datetime.now().strftime("%Y%m%d_%H%M%S");wt=round(22 + (os.urandom(1)[0]%10),1);data={"name":f"session_{sid}.mp4","id":sid,"duration":"8:19","watch_time":wt,"date":datetime.now().isoformat()}
 import json as js
 with open(f"{SESSIONS_DIR}/{sid}.json","w",encoding='utf-8') as f: js.dump(data,f,ensure_ascii=False)
 with open("logs/sessions.jsonl","a",encoding='utf-8') as f: f.write(js.dumps(data,ensure_ascii=False)+"\n")
 return jsonify({"status":"Started","id":sid,"duration":"8:19","watch_time":wt})
@app.route('/list_sessions')
def list_s():
 os.makedirs(SESSIONS_DIR,exist_ok=True);ls=[]
 for p in glob.glob(f"{SESSIONS_DIR}/*.json"):
  try:
   with open(p,encoding='utf-8') as f: ls.append(json.load(f))
  except: pass
 ls.sort(key=lambda x: x.get('date',''), reverse=True)
 return jsonify({"sessions":ls[:20]})
if __name__=="__main__": print("TARIM V8.1 UNIFIED LIVE ON 5001");app.run(host="0.0.0.0",port=5001)
