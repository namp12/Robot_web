import asyncio
import websockets
import json

async def monitor_telemetry():
    uri = "ws://localhost:8000/ws"
    print(f"🔌 Connecting to Backend WebSocket at {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected! Monitoring real-time telemetry stream (Ctrl+C to stop)...")
            count = 0
            while True:  # Print packets infinitely
                message = await websocket.recv()
                data = json.loads(message)
                
                print(f"\n📦 [Packet #{count+1}] Received telemetry snapshot:")
                print(f"   - Status: {data.get('robot_status')} | Mode: {data.get('mode')}")
                print(f"   - Battery: {data.get('battery')}% ({data.get('voltage')}V)")
                print(f"   - Pi Undervoltage Status: {data.get('pi_undervoltage')}")
                print(f"   - CPU: {data.get('cpu')}% | RAM: {data.get('ram')}% | Temp: {data.get('temperature')}°C")
                print(f"   - Pose: {data.get('pose')}")
                print(f"   - AI Detections: {data.get('ai_detections')}")
                
                count += 1
                await asyncio.sleep(0.1) # Fast output
    except Exception as e:
        print(f"❌ Connection failed/closed: {e}")

if __name__ == "__main__":
    asyncio.run(monitor_telemetry())
