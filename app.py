from flask import Flask, render_template_string, request, jsonify, session, redirect
import os, sqlite3, hashlib, json
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = "TARIM_FUSION_v63_UNBREAKABLE"

BASE = os.path.expanduser("~/storage/downloads")
if not os.path.exists(BASE): BASE = os.path.expanduser("~")
DB_PATH = os.path.join(BASE, "tarim_fusion.db")
DOWNLOADS_DIR = os.path.join(BASE, "Tarim_Core_Fusion")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, level TEXT, msg TEXT)")
    cur.execute("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, loc TEXT, time TEXT, category TEXT, priority TEXT, done INTEGER)")
    cur.execute("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, hash TEXT)")
    cur.execute("SELECT * FROM users WHERE username='CEO'")
    if not cur.fetchone():
        ph = hashlib.sha256("Tarim2026!Sovereign".encode()).hexdigest()
        cur.execute("INSERT INTO users VALUES (?,?)", ("CEO", ph))
    cur.execute("SELECT COUNT(*) FROM tasks")
    if cur.fetchone()[0]==0:
        cur.execute("INSERT INTO tasks (title, loc, time, category, priority, done) VALUES (?,?,?,?,?,?)", ("تجهيز المعدات الميدانية", "الحقل الشمالي", "18:00", "مهم", "عالية", 0))
        cur.execute("INSERT INTO tasks (title, loc, time, category, priority, done) VALUES (?,?,?,?,?,?)", ("مراجعة بيانات الحقول", "12 حقل", "20:30", "تحليل", "متوسطة", 1))
        cur.execute("INSERT INTO tasks (title, loc, time, category, priority, done) VALUES (?,?,?,?,?,?)", ("تحديث سجل المحصول", "المراجعة النهائية", "09:00", "مستندات", "منخفضة", 0))
    con.commit()
    con.close()

def add_log(msg, level="INFO"):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("INSERT INTO logs (time, level, msg) VALUES (?,?,?)", (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), level, msg))
    con.commit()
    con.close()

init_db()

def login_required(f):
    @wraps(f)
    def wrap(*a, **k):
        if not session.get('auth'): return redirect('/login')
        return f(*a, **k)
    return wrap

LOGIN_HTML = """
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TARIM OS v6.3 Fusion - دخول</title>
<style>*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}body{background:#080a12;color:#fff;height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#131a2b;border:1px solid #00f3ff33;border-radius:20px;padding:28px;width:92%;max-width:360px}
input{width:100%;padding:14px;margin:8px 0;border-radius:12px;border:1px solid #1e293b;background:#020617;color:#fff}
button{width:100%;padding:14px;background:linear-gradient(90deg,#00f3ff,#0ea5e9);color:#000;border:none;border-radius:12px;font-weight:900;margin-top:10px}
</style></head><body><div class="card"><h2 style="color:#00f3ff;text-align:center">🛡️ TARIM OS v6.3 Fusion</h2><p style="color:#64748b;text-align:center;font-size:.85rem;margin:10px 0">تصميم تيك توك سيادي + SQLite حقيقي<br>CEO / Tarim2026!Sovereign</p>
<form method="POST"><input name="u" placeholder="CEO"><input name="p" type="password" placeholder="كلمة السر"><button>دخول القلعة</button></form>
{% if e %}<p style="color:#ef4444;text-align:center;margin-top:10px">{{e}}</p>{% endif %}
</div></body></html>
"""

FUSION_HTML = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TARIM OS v6.3 Fusion</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Tahoma,sans-serif}
body{background:#080a12;color:#fff;min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden}
.header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#0c111f;position:sticky;top:0;z-index:20;border-bottom:1px solid #ffffff0d}
.logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.35rem;letter-spacing:.5px}
.logo b{color:#00f3ff}
.icon-btn{background:none;border:none;color:#94a3b8;font-size:1.2rem}
.live-card{margin:12px;border-radius:20px;overflow:hidden;position:relative;height:340px;background:#000;border:1px solid #ffffff14}
.live-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800') center/cover;filter:brightness(.6)}
.live-top{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start}
.live-badge{display:flex;gap:6px;align-items:center}
.b-live{background:#ef4444;color:#fff;padding:6px 12px;border-radius:20px;font-size:.75rem;font-weight:800;display:flex;align-items:center;gap:5px}
.b-live i{width:8px;height:8px;background:#fff;border-radius:50%;display:inline-block;animation:blink 1s infinite}
.b-title{background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border:1px solid #ffffff22;padding:6px 12px;border-radius:20px;font-size:.8rem}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.live-views{position:absolute;top:58px;left:12px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);padding:6px 10px;border-radius:12px;font-size:.75rem;display:flex;align-items:center;gap:5px}
.live-actions{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:14px;align-items:center}
.act{width:44px;height:44px;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;border:1px solid #ffffff15;cursor:pointer}
.act small{display:block;font-size:.65rem;margin-top:2px;text-align:center}
.act-col{flex-direction:column}
.tasks-header{display:flex;justify-content:space-between;align-items:center;padding:16px 16px 10px 16px}
.tasks-header h2{font-size:1.15rem;font-weight:800}
.filter-row{display:flex;gap:8px;padding:0 12px 12px 12px;overflow-x:auto}
.filter{padding:8px 18px;border-radius:20px;border:1px solid #ffffff1a;background:#131a2b;font-size:.8rem;font-weight:700;white-space:nowrap;cursor:pointer;transition:.2s}
.f-high{background:#ef4444;color:#fff;border-color:#ef4444}.f-med{background:transparent;color:#fb923c;border-color:#fb923c}.f-low{background:transparent;color:#4ade80;border-color:#4ade80}.f-high.active,.f-med.active,.f-low.active{transform:scale(1.05)}
.task-card{background:#131a2b;border:1px solid #ffffff0f;border-radius:16px;padding:14px;margin:0 12px 10px 12px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden}
.task-card::before{content:'';position:absolute;top:0;left:0;width:60px;height:4px;border-radius:0 0 10px 0}
.t-high::before{background:#ef4444}.t-med::before{background:#fb923c}.t-low::before{background:#4ade80}
.task-left{display:flex;gap:10px;align-items:center}
.check{width:28px;height:28px;border-radius:8px;border:2px solid #ffffff22;display:flex;align-items:center;justify-content:center;cursor:pointer}
.check.done{background:#0ea5e9;border-color:#0ea5e9;color:#fff}
.prio{padding:5px 12px;border-radius:12px;font-size:.7rem;font-weight:800}
.p-high{background:#ef444422;color:#ef4444;border:1px solid #ef444444}.p-med{background:#fb923c22;color:#fb923c;border:1px solid #fb923c44}.p-low{background:#4ade8022;color:#4ade80;border:1px solid #4ade8044}
.bottom{position:fixed;bottom:0;left:0;right:0;background:rgba(12,17,31,0.92);backdrop-filter:blur(20px);border-top:1px solid #ffffff0f;display:flex;justify-content:space-around;align-items:center;padding:8px 10px 12px 10px;z-index:30}
.b-item{display:flex;flex-direction:column;align-items:center;gap:3px;color:#64748b;font-size:.7rem;background:none;border:none;cursor:pointer}
.b-item.active{color:#00f3ff}
.b-center{width:62px;height:62px;background:linear-gradient(135deg,#00f3ff,#0ea5e9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#000;font-weight:900;box-shadow:0 8px 24px #00f3ff55;margin-top:-24px;border:4px solid #080a12}
#toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(150px);background:#00f3ff;color:#000;padding:10px 20px;border-radius:20px;font-weight:800;transition:.4s;z-index:99}
#toast.show{transform:translateX(-50%) translateY(0)}
</style>
</head>
<body>
<header class="header"><div class="logo">💠 <b>TARIM OS</b></div><div style="display:flex;gap:14px"><button class="icon-btn">🔍</button><button class="icon-btn">🔔<span style="width:8px;height:8px;background:#ef4444;border-radius:50%;position:absolute;margin-left:-4px"></span></button></div></header>

<div class="live-card" onclick="runLive()">
<div class="live-bg"></div>
<div class="live-top"><div class="live-badge"><div class="b-live"><i></i>مباشر</div><div class="b-title">بث مباشر سيادي مفعل</div></div><div class="act" style="width:38px;height:38px">➕</div></div>
<div class="live-views">👁️ 24.3K</div>
<div class="live-actions">
<div class="act-col" style="display:flex;flex-direction:column;align-items:center"><div class="act">❤️</div><small style="font-size:.7rem">12.8K</small></div>
<div class="act-col" style="display:flex;flex-direction:column;align-items:center"><div class="act">🎁</div><small style="font-size:.7rem">3.2K</small></div>
<div class="act-col" style="display:flex;flex-direction:column;align-items:center"><div class="act">💬</div><small style="font-size:.7rem">892</small></div>
<div class="act-col" style="display:flex;flex-direction:column;align-items:center"><div class="act">↗️</div><small style="font-size:.7rem">412</small></div>
</div>
</div>

<div class="tasks-header"><h2>قائمة المهام</h2><button class="icon-btn" onclick="addTask()">⤢</button></div>
<div class="filter-row">
<button class="filter f-high active" onclick="filterTasks('all')">🔥 عالية</button>
<button class="filter f-med" onclick="filterTasks('متوسطة')">● متوسطة</button>
<button class="filter f-low" onclick="filterTasks('منخفضة')">▼ منخفضة</button>
</div>

<div id="tasks"></div>

<nav class="bottom">
<button class="b-item active"><span style="font-size:1.3rem">▶️</span>البث</button>
<button class="b-item"><span style="font-size:1.3rem">☰</span>المهام</button>
<button class="b-center" onclick="run('ceo_dispatch')">+</button>
<button class="b-item"><span style="font-size:1.3rem">💬</span>المحادثات</button>
<button class="b-item" onclick="location.href='/logout'"><span style="font-size:1.3rem">👤</span>الملف</button>
</nav>

<div id="toast"></div>
<script>
function toast(m){let t=document.getElementById('toast');t.innerText=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}
let currentFilter='all';
async function loadTasks(){
 let r=await fetch('/api/tasks'); let data=await r.json();
 let html='';
 data.forEach(t=>{
  if(currentFilter!='all' && t.priority!=currentFilter) return;
  let pClass = t.priority=='عالية'?'p-high':t.priority=='متوسطة'?'p-med':'p-low';
  let tClass = t.priority=='عالية'?'t-high':t.priority=='متوسطة'?'t-med':'t-low';
  let done = t.done?'done':'';
  let checkIcon = t.done?'✓':'';
  html+=`<div class="task-card ${tClass}"><div class="task-left"><div class="check ${done}" onclick="toggleTask(${t.id})">${checkIcon}</div><div><div style="font-weight:800;font-size:.9rem">${t.title}</div><div style="color:#64748b;font-size:.7rem;margin-top:2px">${t.category} • اليوم ${t.time} • الموقع: ${t.loc}</div></div></div><div class="prio ${pClass}">${t.priority}</div></div>`;
 });
 document.getElementById('tasks').innerHTML=html;
}
function filterTasks(f){currentFilter=f; document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active')); event.target.classList.add('active'); loadTasks();}
async function toggleTask(id){let r=await fetch('/api/toggle/'+id,{method:'POST'}); let d=await r.json(); toast(d.msg); loadTasks();}
async function run(a){toast('⚡ جاري التنفيذ السيادي...'); let r=await fetch('/exec/'+a,{method:'POST'}); let d=await r.json(); toast(d.msg); loadTasks();}
function runLive(){run('true_video')}
function addTask(){let t=prompt('اسم المهمة الجديدة:'); if(!t) return; fetch('/api/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:t})}).then(()=>{toast('تمت اضافة المهمة');loadTasks();})}
loadTasks();
</script>
</body></html>
"""

@app.route('/login', methods=['GET','POST'])
def login():
    e=None
    if request.method=='POST':
        u=request.form.get('u'); p=request.form.get('p')
        ph=hashlib.sha256(p.encode()).hexdigest()
        con=sqlite3.connect(DB_PATH); cur=con.cursor()
        cur.execute("SELECT * FROM users WHERE username=? AND hash=?", (u, ph))
        if cur.fetchone():
            session['auth']=True; add_log(f"دخول CEO ناجح - Fusion v6.3","LOGIN"); con.close(); return redirect('/')
        else:
            e="كلمة السر خاطئة"; add_log(f"محاولة دخول فاشلة {u}","ALERT")
        con.close()
    return render_template_string(LOGIN_HTML, e=e)

@app.route('/logout')
def logout():
    session.clear(); return redirect('/login')

@app.route('/')
@login_required
def home():
    return render_template_string(FUSION_HTML)

@app.route('/api/tasks')
@login_required
def api_tasks():
    con=sqlite3.connect(DB_PATH); cur=con.cursor()
    cur.execute("SELECT id, title, loc, time, category, priority, done FROM tasks ORDER BY id DESC")
    rows=[dict(zip(["id","title","loc","time","category","priority","done"], r)) for r in cur.fetchall()]
    con.close(); return jsonify(rows)

@app.route('/api/toggle/<int:id>', methods=['POST'])
@login_required
def toggle(id):
    con=sqlite3.connect(DB_PATH); cur=con.cursor()
    cur.execute("SELECT done FROM tasks WHERE id=?", (id,)); done=cur.fetchone()[0]
    cur.execute("UPDATE tasks SET done=? WHERE id=?", (0 if done else 1, id)); con.commit(); con.close()
    add_log(f"تبديل حالة مهمة {id}","TASK")
    return jsonify({"msg":"تم تحديث حالة المهمة"})

@app.route('/api/add', methods=['POST'])
@login_required
def add_task():
    data=request.get_json(); title=data.get('title','مهمة جديدة')
    con=sqlite3.connect(DB_PATH); cur=con.cursor()
    cur.execute("INSERT INTO tasks (title, loc, time, category, priority, done) VALUES (?,?,?,?,?,?)", (title, "ميداني", "09:00", "مهم", "عالية", 0))
    con.commit(); con.close()
    add_log(f"اضافة مهمة جديدة: {title}","TASK")
    return jsonify({"ok":True})

@app.route('/exec/<action>', methods=['POST'])
@login_required
def exec_act(action):
    msg=""
    if action=='ceo_dispatch':
        path=os.path.join(DOWNLOADS_DIR, f"بيان_FUSION_{datetime.now().strftime('%H%M%S')}.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write("--- بيان سيادي FUSION v6.3 ---\n" + "\n".join([f"بند {i}: تم التنفيذ" for i in range(1,11)]))
        sha=hashlib.sha256(open(path,"rb").read()).hexdigest()[:12]
        msg=f"تم توليد البيان + ختم FUSION-{sha}"
    elif action=='true_video':
        msg="🎥 تم تفعيل البث المباشر السيادي - 24.3K مشاهد - الحالة: مفعل"
    else:
        msg=f"تم تنفيذ {action} بنجاح"
    add_log(msg, action.upper())
    return jsonify({"msg":msg})

if __name__=='__main__':
    import os
    port = int(os.environ.get('PORT', 10000))
    print(f"TARIM OS v6.3 Fusion - CEO / Tarim2026!Sovereign - Port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
