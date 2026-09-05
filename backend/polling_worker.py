import sqlite3
import time
import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HUNAR_API_KEY")

def update_db():
    conn = sqlite3.connect('test.db')
    c = conn.cursor()
    # Find active calls
    c.execute("SELECT id, hunar_call_id, status FROM callrecord WHERE status IN ('NOT_STARTED', 'IN_PROGRESS', 'SCHEDULED')")
    active_calls = c.fetchall()
    
    for row in active_calls:
        db_id, hunar_call_id, current_status = row
        if not hunar_call_id:
            continue
            
        try:
            resp = requests.get(
                f"https://api.voice.hunar.ai/external/v1/calls/{hunar_call_id}/",
                headers={"X-API-Key": API_KEY}
            )
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status")
                lifecycle = data.get("lifecycle_status")
                recording_url = data.get("recording_url")
                
                # Default engagement_status safely
                engagement_status = data.get("engagement_status")
                
                result_json = None
                if "result" in data:
                    import json
                    result_json = json.dumps(data["result"])
                
                # Update DB
                c.execute("""
                    UPDATE callrecord 
                    SET status = ?, 
                        lifecycle_status = ?,
                        recording_url = COALESCE(?, recording_url),
                        result_json = COALESCE(?, result_json),
                        engagement_status = COALESCE(?, engagement_status)
                    WHERE id = ?
                """, (status, lifecycle, recording_url, result_json, engagement_status, db_id))
                
                print(f"Updated call {hunar_call_id} to status {status}")
                conn.commit()
        except Exception as e:
            print(f"Error fetching {hunar_call_id}: {e}")
            
    conn.close()

if __name__ == "__main__":
    print("Starting background poller...")
    while True:
        update_db()
        time.sleep(5)
