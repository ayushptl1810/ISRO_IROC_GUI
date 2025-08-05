from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
# from connection import establish_connection
# from utils import set_ekf_origin, stream_all_messages, data_store
import time
import json
import uvicorn
import asyncio
import random
from threading import Thread

app = FastAPI()

# Allow CORS for frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Allowed message types
allowed_types = [
    "BATTERY_STATUS", "HEARTBEAT",
    "EKF_STATUS_REPORT", "AHRS2", "VISION_POSITION_ESTIMATE",
    "VISION_SPEED_ESTIMATE",
    "POSITION_TARGET_LOCAL_NED",
    "POSITION_TARGET_GLOBAL_INT", "DISTANCE_SENSOR_D0", "DISTANCE_SENSOR_D1", "GPS"
]

# Simulated data store (replacing real data_store from utils)
data_store = {}

# 3D plot data accumulation
three_d_plot_data = {
    "lidar_0": [],
    "lidar_1": []
}

# Comment out real MAVLink connection
# master = establish_connection(baud="57600")
# set_ekf_origin(master)
# stream_all_messages(master)

def simulate_data():
    """Simulate MAVLink messages and update data_store"""
    while True:
        # Simulate HEARTBEAT
        data_store["HEARTBEAT"] = {
            "mavpackettype": "HEARTBEAT",
            "type": 2,
            "autopilot": 3,
            "base_mode": 81,
            "custom_mode": 0,
            "system_status": 3 if random.random() > 0.1 else 4,
            "mavlink_version": 3
        }
        
        # Simulate BATTERY_STATUS
        data_store["BATTERY_STATUS"] = {
            "mavpackettype": "BATTERY_STATUS",
            "voltages": [random.randint(12000, 17000)] + [65535]*9,
        }
        
        # Simulate EKF_STATUS_REPORT
        data_store["EKF_STATUS_REPORT"] = {
            "mavpackettype": "EKF_STATUS_REPORT",
            "flags": random.randint(200, 255),
        }
        
        # Simulate AHRS2 (IMU data)
        data_store["AHRS2"] = {
            "mavpackettype": "AHRS2",
            "yaw": random.uniform(-3.14, 3.14)
        }
        
        # Simulate GPS data for flight path
        data_store["GPS"] = {
            "mavpackettype": "GPS_RAW_INT",
            "lat": 28.6139 + random.uniform(-0.001, 0.001),  # Small variations around base coordinates
            "lon": 77.209 + random.uniform(-0.001, 0.001),
            "alt": random.uniform(200, 220),
            "satellites_visible": random.randint(8, 12)
        }
        
        # Simulate VISION_POSITION_ESTIMATE
        data_store["VISION_POSITION_ESTIMATE"] = {
            "mavpackettype": "VISION_POSITION_ESTIMATE",
            "x": random.uniform(-2, 2),
            "y": random.uniform(-2, 2),
            "z": random.uniform(-2, 2),
        }
        
        # Simulate VISION_SPEED_ESTIMATE
        data_store["VISION_SPEED_ESTIMATE"] = {
            "mavpackettype": "VISION_SPEED_ESTIMATE",
            "x": random.uniform(-0.5, 0.5),
            "y": random.uniform(-0.5, 0.5),
        }
        
        # Simulate DISTANCE_SENSOR (two sensors)
        # Generate data for both D0 and D1 sensors
        data_store["DISTANCE_SENSOR_D0"] = {
            "mavpackettype": "DISTANCE_SENSOR",
            "id": 0,
            "current_distance": random.randint(10, 100),
        }
        
        data_store["DISTANCE_SENSOR_D1"] = {
            "mavpackettype": "DISTANCE_SENSOR", 
            "id": 1,
            "current_distance": random.randint(10, 100),
        }
        
        time.sleep(0.1)  # Update every 100ms

# Start simulation in background thread
simulation_thread = Thread(target=simulate_data, daemon=True)
simulation_thread.start()

class ConnectionRequest(BaseModel):
    device:str
    baud:str

@app.post("/connect")
async def connect(req:ConnectionRequest):
    # Comment out real connection
    # global master
    # master = establish_connection(
    #     device=req.device,
    #     baud=req.baud
    # )
    return {"status": "connected", "message": "Simulation mode active"}

@app.get("/set_ekf_origin")
def set_ekf_origin_route():
    # Comment out real EKF origin setting
    # set_ekf_origin()
    return {"status": "success", "message": "EKF origin set (simulated)"}

@app.get("/data")
async def serve_index():
    return FileResponse("index.html")

@app.get("/")
async def serve_index():
    return FileResponse("gui.html")

@app.options("/stream/{message_type}")
async def options_stream(message_type: str):
    return {"status": "ok"}

@app.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/stream/{message_type}")
async def stream_message_type(message_type: str, request: Request):
    if message_type not in allowed_types:
        raise HTTPException(status_code=404, detail="Unsupported message type")
    print(f"Streaming message type: {message_type}")
    
    async def event_generator():
        previous = None
        while True:
            if await request.is_disconnected():
                print(f"Client disconnected from {message_type}")
                break
                
            msg = data_store.get(message_type)
            if msg and msg != previous:
                data = json.dumps(msg)
                print(f"Sending {message_type}: {data}")
                yield {
                    "event": "message",
                    "data": data
                }
                previous = msg
            await asyncio.sleep(0.2)
    
    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

@app.get("/stream/distance_sensor/{sensor_id}")
async def stream_distance_sensor(sensor_id: int, request: Request):
    def filter_by_id(msg):
        print(f"Filtering by ID: {sensor_id}")
        print(f"Message: {msg}")
        return msg.get("id") == sensor_id
    
    # Route to correct sensor based on ID
    message_type = f"DISTANCE_SENSOR_D{sensor_id}"
    
    async def event_generator():
        previous = None
        while True:
            if await request.is_disconnected():
                print(f"Client disconnected from {message_type}")
                break
                
            msg = data_store.get(message_type)
            if msg and msg != previous:
                data = json.dumps(msg)
                print(f"Sending {message_type}: {data}")
                yield {
                    "event": "message",
                    "data": data
                }
                previous = msg
            await asyncio.sleep(0.2)
    
    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

@app.options("/stream/distance_sensor/{sensor_id}")
async def options_distance_sensor(sensor_id: int):
    return {"status": "ok"}

@app.get("/stream/all")
async def stream_all(request: Request):
    previous = {}
    while True:
        if await request.is_disconnected():
            break

        for msg_type, msg in data_store.items():
            if msg_type not in previous or previous[msg_type] != msg:
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "message_type": msg_type,
                        "data": msg
                    })
                }
                previous[msg_type] = msg
        await asyncio.sleep(0.1)

@app.get("/stream/3d_plot")
async def stream_3d_plot(request: Request):
    """Stream accumulated 3D plot data"""
    print("Streaming 3D plot data")
    
    async def event_generator():
        previous_data = None
        while True:
            if await request.is_disconnected():
                print("Client disconnected from 3D plot stream")
                break
                
            # Get current position and distance sensor data
            vision_pos = data_store.get("VISION_POSITION_ESTIMATE", {})
            d0_data = data_store.get("DISTANCE_SENSOR_D0", {})
            d1_data = data_store.get("DISTANCE_SENSOR_D1", {})
            
            # Create new data points
            if vision_pos and d0_data and d1_data:
                x = vision_pos.get("x", 0)
                y = vision_pos.get("y", 0)
                d0 = d0_data.get("current_distance", 0)
                d1 = d1_data.get("current_distance", 0)
                
                # Add new data points to accumulation
                three_d_plot_data["lidar_0"].append({
                    "x": x,
                    "y": y,
                    "z": d0,
                    "timestamp": time.time()
                })
                
                three_d_plot_data["lidar_1"].append({
                    "x": x + 0.2,  # Offset for D1
                    "y": y,
                    "z": d1,
                    "timestamp": time.time()
                })
                
                # Keep only last 100 points to prevent memory issues
                if len(three_d_plot_data["lidar_0"]) > 100:
                    three_d_plot_data["lidar_0"] = three_d_plot_data["lidar_0"][-100:]
                if len(three_d_plot_data["lidar_1"]) > 100:
                    three_d_plot_data["lidar_1"] = three_d_plot_data["lidar_1"][-100:]
                
                # Prepare data for frontend
                plot_data = {
                    "lidar_0": three_d_plot_data["lidar_0"],
                    "lidar_1": three_d_plot_data["lidar_1"]
                }
                
                if plot_data != previous_data:
                    data = json.dumps(plot_data)
                    print(f"Sending 3D plot data: {len(three_d_plot_data['lidar_0'])} points")
                    yield {
                        "event": "message",
                        "data": data
                    }
                    previous_data = plot_data
            
            await asyncio.sleep(0.2)
    
    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        }
    )

@app.get("/reset_3d_plot")
async def reset_3d_plot():
    """Reset accumulated 3D plot data"""
    global three_d_plot_data
    three_d_plot_data = {
        "lidar_0": [],
        "lidar_1": []
    }
    print("3D plot data reset")
    return {"message": "3D plot data reset successfully"}

@app.options("/stream/3d_plot")
async def options_3d_plot():
    """Handle CORS preflight for 3D plot stream"""
    return {"message": "OK"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
