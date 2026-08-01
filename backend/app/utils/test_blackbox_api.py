import asyncio
import requests
import websockets
import json

BACKEND_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/blackbox"

async def listen_blackbox_ws():
    print(f"🔌 Connecting to BlackBox WebSocket: {WS_URL} ...")
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("✅ Connected to WebSocket! Listening for real-time logs...")
            while True:
                message = await websocket.recv()
                log_entry = json.loads(message)
                print(f"📥 [WS RECEIVED] ID: {log_entry.get('id')} | Event: {log_entry.get('event')} | Battery: {log_entry.get('battery')}% | CPU/RAM: {log_entry.get('cpu')}%/{log_entry.get('ram')}% | Pose: ({log_entry.get('pos_x')}, {log_entry.get('pos_y')})")
    except ConnectionRefusedError:
        print("❌ Connection refused. Is backend server running on port 8000?")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")

def check_rest_api():
    print(f"\n📡 Querying historical logs via REST API: {BACKEND_URL}/api/blackbox ...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/blackbox")
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ Success! Fetched {len(logs)} records from SQLite.")
            if logs:
                latest = logs[0]
                print(f"   Latest log entry -> ID: {latest.get('id')} | Event: {latest.get('event')} | Time: {latest.get('timestamp')}")
            else:
                print("   No records in DB yet.")
        else:
            print(f"❌ Failed with status code: {response.status_code}")
    except Exception as e:
        print(f"❌ REST API error: {e}")

async def main():
    check_rest_api()
    # Listen to WebSocket
    await listen_blackbox_ws()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Stopped listening.")
