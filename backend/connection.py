from pymavlink import mavutil

DEFAULT_DEVICE = "COM3"
DEFAULT_BAUD = 115200

def establish_connection(device=DEFAULT_DEVICE, baud=DEFAULT_BAUD):
    master = mavutil.mavlink_connection(device, baud=baud)

# Wait for heartbeat to establish system/component ID
    print("Waiting for heartbeat...")
    master.wait_heartbeat(timeout=5)
    print(f"Connected to system {master.target_system}, component {master.target_component}")
    return master

