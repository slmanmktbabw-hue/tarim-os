from flask import Flask, request, jsonify, render_template_string
import json, os

app = Flask(__name__)
LOG_FILE = "logs/training_events.jsonl"
MODEL_FILE = "model.json"

def load_threshold():
    try:
        with open(MODEL_FILE, encoding='utf-8') as f:
            return json.load(f).get("threshold", 20.3)
    except:
        return 20.3

HTML = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TARIM OS V3.0</title>
<style>
body{background:#000;color:#0f0;font-family:monospace;margin:0;padding:15px}
.header{text-align:center;font-size:22px;font-weight:bold;text-shadow:0 0 10px #0f0;margin-bottom:15px}
.box{border:2px solid #0f0;padding:20px;border-radius:15px;box-shadow:0 0 20px rgba(0,255,0,0.3);text-align:center}
.btn{padding:12px 20px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;margin:5px}
.green{background:#0f0;color:#000} .white{background:#fff;color:#000}
.banner{margin-top:20px;border:1px dashed #0f0;padding:15px;border-radius:10px;text-align:center}
</style>
</head>
<body>
<div class="header">TARIM OS V3.0 - LIVE 👑</div>
<div class="box">
<div id="stats">Loaded threshold=20.3 - TOTAL 11 events [ML]</div><br>
<button class="btn white" onclick="test(5)">اختبر 5s</button>
<button class="btn green" onclick="test(25)">اختبر 25s</button>
<div id="result" style="margin-top:15px;color:yellow"></div>
</div>
<div class="banner">🔥 انت الآن فاتح أول نظام تشغيل AI يمني في المتصفح من جوالك في تعز! 🇾🇪<br><small>TARIM OS - Built in Taiz, Yemen - 2026</small></div>
<div id="logs" style="margin-top:20px;text-align:right;font-size:12px"></div>
<script>
async function loadStats(){let r=await fetch('/stats');let d=await r.json();document.getElementById('stats').innerHTML=`Loaded threshold=${d.threshold} - TOTAL ${d.total} events [ML]`;document.getElementById('logs').innerHTML=d.last.map(e=>`${e.watch_time}s -> ${e.action} ✅`).join('<br>');}
async function test(sec){let r=await fetch('/get_next_video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({watch_time:sec})});let d=await r.json();document.getElementById('result').innerHTML=`Action: ${d.action} | threshold: ${d.threshold_used}`;loadStats();}
loadStats();setInterval(loadStats,2000);
</script>
</body>
</html>
"""

@app.route('/')
def home(): return render_template_string(HTML)

@app.route('/stats')
def stats():
    th=load_threshold();ev=[]
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, encoding='utf-8') as f:
            for line in f:
                try: ev.append(json.loads(line))
                except: pass
    return jsonify({"threshold":th,"total":len(ev),"last":ev[-10:][::-1]})

@app.route('/get_next_video', methods=['POST'])
def get_next_video():
    data=request.json or {};wt=float(data.get('watch_time',0));th=load_threshold();action="split_screen" if wt>=th else "wait"
    os.makedirs("logs", exist_ok=True)
    with open(LOG_FILE,"a",encoding='utf-8') as f: f.write(json.dumps({"watch_time":wt,"action":action})+"\n")
    return jsonify({"action":action,"threshold_used":th})

if __name__=="__main__":
    print("🔥 انت الآن فاتح أول نظام تشغيل AI يمني في المتصفح من جوالك في تعز!")
    app.run(host="0.0.0.0",port=5001)
