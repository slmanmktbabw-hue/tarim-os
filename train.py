import json, pickle, statistics
FILE="logs/training_events.jsonl"
data=[]
with open(FILE) as f:
    for line in f:
        try: data.append(json.loads(line))
        except: pass

waits=[d['watch_time'] for d in data if d['action']=='wait']
splits=[d['watch_time'] for d in data if d['action']=='split_screen']

avg_wait=statistics.mean(waits) if waits else 10
avg_split=statistics.mean(splits) if splits else 25
threshold=(avg_wait+avg_split)/2

model={"threshold":threshold,"avg_wait":avg_wait,"avg_split":avg_split,"total":len(data)}
print(f"🧠 Dataset: {len(data)} events")
print(f"   avg wait: {avg_wait:.1f}s, avg split: {avg_split:.1f}s")
print(f"   👉 learned threshold: {threshold:.1f}s (بدل 20 الثابت)")

with open("model.pkl","wb") as out:
    pickle.dump(model,out)

# حدث ml_adapter ليستخدم الموديل
cat > ml_adapter.py << 'PYEOF'
import pickle, os
class MLAdapter:
    def __init__(self):
        try:
            with open("model.pkl","rb") as f:
                self.model=pickle.load(f)
            print(f"[ML] Loaded model threshold={self.model['threshold']:.1f}")
        except:
            self.model={"threshold":20}
    def predict_boredom_score(self,user,curr):
        wt=int(curr.get('watch_time',0))
        return wt > self.model.get('threshold',20)
ml_adapter=MLAdapter()
PYEOF

print("✅ model.pkl created + ml_adapter.py updated!")
