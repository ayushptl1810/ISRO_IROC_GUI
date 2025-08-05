import random
import time
from threading import Thread

class SimulatedMAVLink:
    """Simulates MAVLink communication with realistic message structures"""
    
    def __init__(self):
        self.data_store = {}
        self.is_running = False
        self.simulation_thread = None
        
    def start_simulation(self):
        """Start the simulated MAVLink data generation"""
        if not self.is_running:
            self.is_running = True
            self.simulation_thread = Thread(target=self._simulate_mavlink_data, daemon=True)
            self.simulation_thread.start()
            print("Simulated MAVLink data generation started")
    
    def stop_simulation(self):
        """Stop the simulated MAVLink data generation"""
        self.is_running = False
        if self.simulation_thread:
            self.simulation_thread.join(timeout=1)
        print("Simulated MAVLink data generation stopped")
    
    def _simulate_mavlink_data(self):
        """Simulate MAVLink message generation"""
        while self.is_running:
            # Simulate HEARTBEAT message
            self.data_store["HEARTBEAT"] = {
                "mavpackettype": "HEARTBEAT",
                "type": 2,  # MAV_TYPE_QUADROTOR
                "autopilot": 3,  # MAV_AUTOPILOT_ARDUPILOTMEGA
                "base_mode": 81,
                "custom_mode": 0,
                "system_status": 3 if random.random() > 0.1 else 4,  # MAV_STATE_ACTIVE/STANDBY
                "mavlink_version": 3
            }
            
            # Simulate BATTERY_STATUS message
            self.data_store["BATTERY_STATUS"] = {
                "mavpackettype": "BATTERY_STATUS",
                "voltages": [random.randint(12000, 17000)] + [65535]*9,  # First cell + 9 unused
                "current_consumed": random.randint(1000, 5000),
                "energy_consumed": random.randint(50000, 200000),
                "temperature": random.randint(20, 40),
                "current": random.uniform(0.5, 2.0),
                "id": 0,
                "battery_function": 0,  # MAV_BATTERY_FUNCTION_UNKNOWN
                "type": 0,  # MAV_BATTERY_TYPE_UNKNOWN
                "charge_state": 1,  # MAV_BATTERY_CHARGE_STATE_OK
                "time_remaining": random.randint(300, 1800),
                "voltage": random.uniform(12.0, 16.8)
            }
            
            # Simulate EKF_STATUS_REPORT message
            self.data_store["EKF_STATUS_REPORT"] = {
                "mavpackettype": "EKF_STATUS_REPORT",
                "flags": random.randint(200, 255),
                "velocity_variance": random.uniform(0.01, 0.1),
                "pos_horiz_variance": random.uniform(0.01, 0.1),
                "pos_vert_variance": random.uniform(0.01, 0.1),
                "compass_variance": random.uniform(0.01, 0.1),
                "terrain_alt_variance": random.uniform(0.01, 0.1),
                "airspeed_variance": random.uniform(0.01, 0.1)
            }
            
            # Simulate AHRS2 message (Attitude and Heading Reference System)
            self.data_store["AHRS2"] = {
                "mavpackettype": "AHRS2",
                "roll": random.uniform(-0.5, 0.5),  # Roll in radians
                "pitch": random.uniform(-0.5, 0.5),  # Pitch in radians
                "yaw": random.uniform(-3.14, 3.14),  # Yaw in radians
                "altitude": random.uniform(200, 220),
                "lat": 28.6139 + random.uniform(-0.001, 0.001),
                "lng": 77.209 + random.uniform(-0.001, 0.001)
            }
            
            # Simulate GPS_RAW_INT message
            self.data_store["GPS"] = {
                "mavpackettype": "GPS_RAW_INT",
                "time_usec": int(time.time() * 1000000),
                "fix_type": 3,  # GPS_FIX_TYPE_3D
                "lat": 28.6139 + random.uniform(-0.001, 0.001),
                "lon": 77.209 + random.uniform(-0.001, 0.001),
                "alt": random.uniform(200, 220),
                "eph": random.uniform(1.0, 5.0),  # GPS HDOP
                "epv": random.uniform(1.0, 5.0),  # GPS VDOP
                "vel": random.uniform(0, 10),  # GPS ground speed
                "cog": random.uniform(0, 360),  # Course over ground
                "satellites_visible": random.randint(8, 12),
                "alt_ellipsoid": random.uniform(200, 220),
                "h_acc": random.uniform(1.0, 5.0),  # Position uncertainty
                "v_acc": random.uniform(1.0, 5.0),  # Altitude uncertainty
                "vel_acc": random.uniform(0.1, 1.0),  # Speed uncertainty
                "hdg_acc": random.uniform(1.0, 10.0)  # Heading uncertainty
            }
            
            # Simulate VISION_POSITION_ESTIMATE message
            self.data_store["VISION_POSITION_ESTIMATE"] = {
                "mavpackettype": "VISION_POSITION_ESTIMATE",
                "usec": int(time.time() * 1000000),
                "x": random.uniform(-2, 2),
                "y": random.uniform(-2, 2),
                "z": random.uniform(-2, 2),
                "roll": random.uniform(-0.1, 0.1),
                "pitch": random.uniform(-0.1, 0.1),
                "yaw": random.uniform(-3.14, 3.14),
                "covariance": [0.01] * 21  # 6x6 covariance matrix flattened
            }
            
            # Simulate VISION_SPEED_ESTIMATE message
            self.data_store["VISION_SPEED_ESTIMATE"] = {
                "mavpackettype": "VISION_SPEED_ESTIMATE",
                "usec": int(time.time() * 1000000),
                "x": random.uniform(-0.5, 0.5),
                "y": random.uniform(-0.5, 0.5),
                "z": random.uniform(-0.1, 0.1),
                "covariance": [0.01] * 9  # 3x3 covariance matrix flattened
            }
            
            # Simulate DISTANCE_SENSOR messages for two sensors
            self.data_store["DISTANCE_SENSOR_D0"] = {
                "mavpackettype": "DISTANCE_SENSOR",
                "time_boot_ms": int(time.time() * 1000),
                "min_distance": 5,
                "max_distance": 1200,
                "current_distance": random.randint(10, 100),
                "type": 0,  # MAV_DISTANCE_SENSOR_LASER
                "id": 0,
                "orientation": 0,  # MAV_SENSOR_ORIENTATION_NONE
                "covariance": 0.0,
                "horizontal_fov": 0.0,
                "vertical_fov": 0.0,
                "quaternion": [0.0, 0.0, 0.0, 0.0],
                "signal_quality": random.randint(0, 100)
            }
            
            self.data_store["DISTANCE_SENSOR_D1"] = {
                "mavpackettype": "DISTANCE_SENSOR",
                "time_boot_ms": int(time.time() * 1000),
                "min_distance": 5,
                "max_distance": 1200,
                "current_distance": random.randint(10, 100),
                "type": 0,  # MAV_DISTANCE_SENSOR_LASER
                "id": 1,
                "orientation": 0,  # MAV_SENSOR_ORIENTATION_NONE
                "covariance": 0.0,
                "horizontal_fov": 0.0,
                "vertical_fov": 0.0,
                "quaternion": [0.0, 0.0, 0.0, 0.0],
                "signal_quality": random.randint(0, 100)
            }
            
            time.sleep(0.1)  # Update every 100ms
    
    def get_message(self, message_type):
        """Get a specific MAVLink message"""
        return self.data_store.get(message_type)
    
    def get_all_messages(self):
        """Get all current MAVLink messages"""
        return self.data_store.copy()
    
    def is_connected(self):
        """Check if MAVLink connection is active"""
        return self.is_running and len(self.data_store) > 0

# Global instance
simulated_mavlink = SimulatedMAVLink()