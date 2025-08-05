"""
Background MAVLink Message Processing
Handles real MAVLink communication with flight controllers
"""

import time
import logging
from threading import Thread, Event
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# This dictionary is the shared "state" between the MAVLink listener and the API.
# The background thread writes to it, and the API endpoints read from it.
data_store = {}

# This event is used to signal the background thread to stop running.
stop_thread_event = Event()

# Global thread reference
background_thread: Optional[Thread] = None

def stream_real_mavlink_messages(master, stop_event: Event):
    """
    This function is designed to run in a background thread.
    It continuously listens for MAVLink messages from the 'master' connection
    and updates the global 'data_store' with the latest data for relevant messages.
    """
    logger.info("Starting background MAVLink message listener...")
    
    # A set of message types we are interested in for the GUI
    INTERESTED_TYPES = {
        "HEARTBEAT", 
        "BATTERY_STATUS", 
        "EKF_STATUS_REPORT", 
        "AHRS2",
        "VISION_POSITION_ESTIMATE", 
        "VISION_SPEED_ESTIMATE", 
        "DISTANCE_SENSOR", 
        "GPS_RAW_INT"
    }

    try:
        while not stop_event.is_set():
            # Use a timeout so the loop doesn't block forever if no messages arrive.
            # This allows the stop_event check to be performed periodically.
            msg = master.recv_match(blocking=True, timeout=1) 
            
            if msg is None:
                continue

            msg_type = msg.get_type()

            # If the message is one we care about, update the data_store
            if msg_type in INTERESTED_TYPES:
                msg_dict = msg.to_dict()
                
                # For distance sensors, we need to handle different IDs
                if msg_type == 'DISTANCE_SENSOR':
                    sensor_id = msg_dict.get('id', 0)
                    # Store them with unique keys like 'DISTANCE_SENSOR_D0'
                    data_store[f"DISTANCE_SENSOR_D{sensor_id}"] = msg_dict
                    logger.debug(f"Updated DISTANCE_SENSOR_D{sensor_id}")
                else:
                    data_store[msg_type] = msg_dict
                    logger.debug(f"Updated {msg_type}")
                
                # Optional: for debugging, you can log the update.
                # logger.info(f"Updated data_store with {msg_type}")

    except Exception as e:
        logger.error(f"Error in MAVLink message listener: {str(e)}")
    finally:
        logger.info("Stopping background MAVLink message listener.")

def start_background_thread(master):
    """Start the background MAVLink message listener thread"""
    global background_thread, stop_thread_event
    
    # Reset the stop event
    stop_thread_event.clear()
    
    # Create and start the background thread
    background_thread = Thread(
        target=stream_real_mavlink_messages,
        args=(master, stop_thread_event),
        daemon=True
    )
    background_thread.start()
    
    logger.info("Background MAVLink thread started")
    return background_thread

def stop_background_thread():
    """Stop the background MAVLink message listener thread"""
    global background_thread, stop_thread_event
    
    if background_thread and background_thread.is_alive():
        logger.info("Stopping background MAVLink thread...")
        stop_thread_event.set()
        background_thread.join(timeout=5)  # Wait up to 5 seconds
        logger.info("Background MAVLink thread stopped")
    else:
        logger.info("No background thread to stop")

def get_data_store():
    """Get the current data store"""
    return data_store.copy()

def clear_data_store():
    """Clear the data store"""
    global data_store
    data_store.clear()
    logger.info("Data store cleared")
