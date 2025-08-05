from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import time
import json
import asyncio
import random
from threading import Thread

app = FastAPI()

# Allow CORS for frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated data store
data_store = {}

# Allowed message types
allowed_types = [
    "OPTICAL_FLOW", "BATTERY_STATUS", "HEARTBEAT",
    "EKF_STATUS_REPORT", "AHRS2", "VISION_POSITION_ESTIMATE",
    "VISION_SPEED_ESTIMATE",
    "POSITION_TARGET_LOCAL_NED",
    "POSITION_TARGET_GLOBAL_INT"
]

def simulate_data():
    while True:
        # Simulate HEARTBEAT
        data_store["HEARTBEAT"] = {
            "mavpackettype": "HEARTBEAT",
            "type": 2,
            "autopilot": 3,
            "base_mode": 81,
            "custom_mode": 0,
            "system_status": 3 if random.random() > 0.1 else 4,  # Sometimes not active
            "mavlink_version": 3
        }
        # Simulate BATTERY_STATUS
        data_store["BATTERY_STATUS"] = {
            "mavpackettype": "BATTERY_STATUS",
            "voltages": [random.randint(12000, 17000)] + [65535]*9,
            "current_battery": random.randint(0, 100),
            "battery_remaining": random.randint(50, 100)
        }
        # Simulate EKF_STATUS_REPORT
        data_store["EKF_STATUS_REPORT"] = {
            "mavpackettype": "EKF_STATUS_REPORT",
            "flags": random.randint(200, 255),
            "velocity_variance": random.uniform(0, 0.1),
            "pos_horiz_variance": random.uniform(0, 0.01),
            "pos_vert_variance": random.uniform(0, 0.02),
            "compass_variance": random.uniform(0, 0.001),
            "terrain_alt_variance": random.uniform(0, 0.1)
        }
        # Simulate OPTICAL_FLOW
        data_store["OPTICAL_FLOW"] = {
            "mavpackettype": "OPTICAL_FLOW",
            "flow_x": random.randint(-10, 10),
            "flow_y": random.randint(-10, 10),
            "flow_comp_m_x": random.uniform(-1, 1),
            "flow_comp_m_y": random.uniform(-1, 1),
            "quality": random.randint(0, 100),
            "ground_distance": random.uniform(0.1, 2.0)
        }
        # Simulate AHRS2
        data_store["AHRS2"] = {
            "mavpackettype": "AHRS2",
            "roll": random.uniform(-1, 1),
            "pitch": random.uniform(-1, 1),
            "yaw": random.uniform(-3.14, 3.14),
            "altitude": random.uniform(0, 10),
            "lat": 0,
            "lng": 0
        }
        # Simulate VISION_POSITION_ESTIMATE
        data_store["VISION_POSITION_ESTIMATE"] = {
            "mavpackettype": "VISION_POSITION_ESTIMATE",
            "x": random.uniform(-2, 2),
            "y": random.uniform(-2, 2),
            "z": random.uniform(-2, 2),
            "roll": random.uniform(-3.14, 3.14),
            "pitch": random.uniform(-3.14, 3.14),
            "yaw": random.uniform(-3.14, 3.14),
            "covariance": [0.0]*21,
            "reset_counter": 0
        }
        # Simulate DISTANCE_SENSOR (two sensors)
        data_store["DISTANCE_SENSOR"] = {
            "id": random.choice([0, 1]),
            "current_distance": random.randint(10, 100),
            "min_distance": 5,
            "max_distance": 1200,
            "type": 0,
            "orientation": random.randint(0, 30),
            "covariance": 0
        }
        time.sleep(0.2)

# Start simulation in background
Thread(target=simulate_data, daemon=True).start()

@app.get("/data")
async def serve_index():
    return FileResponse("index.html")

@app.get("/")
async def serve_gui():
    return FileResponse("gui.html")

def stream_generator(message_type: str, filter_fn=None):
    previous = None
    while True:
        msg = data_store.get(message_type)
        if msg and msg != previous:
            if filter_fn is None or filter_fn(msg):
                yield {
                    "event": "update",
                    "data": json.dumps(msg)
                }
                previous = msg
        time.sleep(0.2)

@app.get("/stream/{message_type}")
async def stream_message_type(message_type: str, request: Request):
    if message_type not in allowed_types:
        raise HTTPException(status_code=404, detail="Unsupported message type")
    return EventSourceResponse(stream_generator(message_type))

@app.get("/stream/distance_sensor/{sensor_id}")
async def stream_distance_sensor(sensor_id: int, request: Request):
    def filter_by_id(msg):
        return msg.get("id") == sensor_id
    return EventSourceResponse(stream_generator("DISTANCE_SENSOR", filter_fn=filter_by_id))

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
        await asyncio.sleep(0.2)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)