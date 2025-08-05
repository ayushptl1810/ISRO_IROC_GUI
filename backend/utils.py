from pymavlink import mavutil
from threading import Thread

data_store = {}  # Global store for latest MAVLink messages

def set_ekf_origin(master):
    print("Attempting to set EKF origin...")
    master.mav.command_long_send(
        master.target_system,
        master.target_component,
        mavutil.mavlink.MAV_CMD_DO_SET_HOME,
        0,
        1, 0, 0, 0, 0, 0, 0
    )
    print("EKF origin 'set home' command sent.")

def stream_all_messages(master):
    """
    Continuously receive messages and update the global data_store.
    """
    def receive_loop():
        while True:
            msg = master.recv_match(blocking=True, timeout=2)
            if msg and msg.get_type() != "BAD_DATA":
                data_store[msg.get_type()] = msg.to_dict()

    t = Thread(target=receive_loop, daemon=True)
    t.start()