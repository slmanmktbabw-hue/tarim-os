while true; do
  count=$(wc -l < logs/training_events.jsonl)
  if [ $count -gt 15 ]; then
    echo "🤖 Auto-retraining at $count events..."
    python train.py
    pkill -f dashboard.py
    sleep 1
    python dashboard.py &
    echo "✅ Dashboard reloaded with new threshold!"
    break
  fi
  echo "Current: $count events... waiting for >15"
  sleep 2
done
