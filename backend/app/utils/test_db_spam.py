import time
import requests

def run_db_spam():
    url = "http://localhost:8000/api/blackbox/record?mission_id=1&event=SPAM_TEST"
    print("🚀 Starting Database BlackBox Spam Test...")
    print(f"📡 Target API: {url}")
    print("Press Ctrl+C to stop spamming...\n")
    
    count = 0
    try:
        while True:
            start_time = time.time()
            # Send POST request to write telemetry snapshot to SQLite
            response = requests.post(url)
            latency = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ [Spam #{count+1}] SQLite Insert SUCCESS | ID: {data.get('id')} | Event: {data.get('event')} | Latency: {latency:.2f}ms")
            else:
                print(f"❌ [Spam #{count+1}] API Failed with status {response.status_code}")
                
            count += 1
            time.sleep(0.2) # 5 inserts per second (high-frequency)
    except KeyboardInterrupt:
        print(f"\n🛑 Spam test stopped. Total SQLite inserts: {count}")
    except Exception as e:
        print(f"\n❌ Error during spam test: {e}")

if __name__ == "__main__":
    run_db_spam()
