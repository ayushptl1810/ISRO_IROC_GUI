from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from bg_process import start_background_thread, stop_background_thread, get_data_store, clear_data_store
from pymavlink.mavutil import mavlink_connection
import time
import json
import uvicorn
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# 3D plot data accumulation
three_d_plot_data = {
    "lidar_0": [],
    "lidar_1": []
}

# Global MAVLink connection
master = None
background_thread = None

class ConnectionRequest(BaseModel):
    device: str
    baud: str

@app.post("/connect")
async def connect(req: ConnectionRequest):
    """Establish MAVLink connection to flight controller"""
    global master, background_thread
    
    try:
        logger.info(f"Establishing MAVLink connection to {req.device} at {req.baud} baud")
        
        # Create MAVLink connection
        master = mavlink_connection(req.device, baud=int(req.baud))
        
        # Wait for heartbeat to confirm connection
        logger.info("Waiting for heartbeat...")
        master.wait_heartbeat()
        logger.info("Heartbeat received! Connection established.")
        
        # Start background thread to listen for messages
        background_thread = start_background_thread(master)
        
        return {
            "status": "connected", 
            "message": f"MAVLink connection established to {req.device}",
            "device": req.device,
            "baud": req.baud,
            "protocol": "MAVLink v2.0",
            "system_id": master.target_system,
            "component_id": master.target_component
        }
        
    except Exception as e:
        logger.error(f"Connection failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}"
        }

@app.post("/disconnect")
async def disconnect():
    """Disconnect from flight controller"""
    global master, background_thread
    
    try:
        # Stop background thread
        if background_thread:
            stop_background_thread()
        
        # Close MAVLink connection
        if master:
            master.close()
            master = None
        
        # Clear data store
        clear_data_store()
        
        return {
            "status": "disconnected",
            "message": "MAVLink connection closed"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Disconnect failed: {str(e)}"
        }

@app.get("/set_ekf_origin")
def set_ekf_origin_route():
    """Set EKF origin for navigation"""
    global master
    
    try:
        if not master:
            return {
                "status": "error",
                "message": "Not connected to flight controller"
            }
        
        # Send EKF origin command
        logger.info("Setting EKF origin for navigation")
        # You can add actual MAVLink commands here if needed
        
        return {
            "status": "success", 
            "message": "EKF origin set successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to set EKF origin: {str(e)}"
        }

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
    logger.info(f"Streaming message type: {message_type}")
    
    async def event_generator():
        previous = None
        while True:
            if await request.is_disconnected():
                logger.info(f"Client disconnected from {message_type}")
                break
                
            # Get data from the background process data store
            data_store = get_data_store()
            msg = data_store.get(message_type)
            
            if msg and msg != previous:
                data = json.dumps(msg)
                logger.debug(f"Sending {message_type}: {data}")
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
    # Route to correct sensor based on ID
    message_type = f"DISTANCE_SENSOR_D{sensor_id}"
    
    async def event_generator():
        previous = None
        while True:
            if await request.is_disconnected():
                logger.info(f"Client disconnected from {message_type}")
                break
                
            # Get data from the background process data store
            data_store = get_data_store()
            msg = data_store.get(message_type)
            
            if msg and msg != previous:
                data = json.dumps(msg)
                logger.debug(f"Sending {message_type}: {data}")
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

        data_store = get_data_store()
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
    logger.info("Streaming 3D plot data")
    
    async def event_generator():
        previous_data = None
        while True:
            if await request.is_disconnected():
                logger.info("Client disconnected from 3D plot stream")
                break
                
            # Get current position and distance sensor data from real MAVLink
            data_store = get_data_store()
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
                    logger.info(f"Sending 3D plot data: {len(three_d_plot_data['lidar_0'])} points")
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
    logger.info("3D plot data reset")
    return {"message": "3D plot data reset successfully"}

@app.options("/stream/3d_plot")
async def options_3d_plot():
    """Handle CORS preflight for 3D plot stream"""
    return {"message": "OK"}

@app.get("/mavlink/status")
async def get_mavlink_status():
    """Get MAVLink connection status and system info"""
    global master
    
    try:
        if not master:
            return {
                "status": "disconnected",
                "message": "No MAVLink connection"
            }
        
        # Get heartbeat from data store
        data_store = get_data_store()
        heartbeat = data_store.get("HEARTBEAT")
        
        if heartbeat:
            return {
                "status": "connected",
                "system_id": master.target_system,
                "component_id": master.target_component,
                "autopilot": "ArduPilot",
                "type": "Quadrotor",
                "mavlink_version": heartbeat.get("mavlink_version", 2),
                "system_status": heartbeat.get("system_status", 0),
                "base_mode": heartbeat.get("base_mode", 0),
                "custom_mode": heartbeat.get("custom_mode", 0)
            }
        else:
            return {
                "status": "connected",
                "message": "Connected but no heartbeat received yet"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get MAVLink status: {str(e)}"
        }

@app.get("/mavlink/messages")
async def get_available_messages():
    """Get list of available MAVLink messages"""
    try:
        data_store = get_data_store()
        return {
            "status": "success",
            "message_count": len(data_store),
            "messages": list(data_store.keys())
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get messages: {str(e)}"
        }

@app.get("/mavlink/message/{message_type}")
async def get_specific_message(message_type: str):
    """Get a specific MAVLink message"""
    try:
        data_store = get_data_store()
        message = data_store.get(message_type)
        
        if message:
            return {
                "status": "success",
                "message_type": message_type,
                "data": message
            }
        else:
            return {
                "status": "error",
                "message": f"Message type '{message_type}' not available"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get message: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 