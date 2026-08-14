import pickle
class MLAdapter:
    def __init__(self):
        try:
            with open("model.pkl","rb") as f:
                self.model=pickle.load(f)
            print(f"[ML] Loaded model threshold={self.model['threshold']:.1f} - TOTAL {self.model['total']} events")
        except:
            self.model={"threshold":20}
    def predict_boredom_score(self,user,curr):
        wt=int(curr.get('watch_time',0))
        return wt > self.model.get('threshold',20)
ml_adapter=MLAdapter()
