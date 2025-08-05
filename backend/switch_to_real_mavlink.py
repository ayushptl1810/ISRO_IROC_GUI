#!/usr/bin/env python3
"""
Script to switch from simulated MAVLink to real MAVLink
This script will replace app.py with the real MAVLink version
"""

import os
import shutil
import sys

def switch_to_real_mavlink():
    """Switch from simulated to real MAVLink"""
    print("Switching to real MAVLink...")
    
    # Backup current app.py
    if os.path.exists("app.py"):
        shutil.copy("app.py", "app_simulated_backup.py")
        print("✓ Backed up current app.py to app_simulated_backup.py")
    
    # Copy real MAVLink version to app.py
    if os.path.exists("app_real_mavlink.py"):
        shutil.copy("app_real_mavlink.py", "app.py")
        print("✓ Replaced app.py with real MAVLink version")
    else:
        print("❌ Error: app_real_mavlink.py not found!")
        return False
    
    print("\n✅ Successfully switched to real MAVLink!")
    print("\nTo use real MAVLink:")
    print("1. Connect your flight controller via USB")
    print("2. Find the device path (e.g., /dev/ttyUSB0 on Linux, COM3 on Windows)")
    print("3. Run: python app.py")
    print("4. In the frontend, connect with your device path and baud rate")
    print("\nTo switch back to simulation:")
    print("1. Run: python switch_to_simulation.py")
    
    return True

def switch_to_simulation():
    """Switch back to simulated MAVLink"""
    print("Switching back to simulated MAVLink...")
    
    # Restore simulated version
    if os.path.exists("app_simulated_backup.py"):
        shutil.copy("app_simulated_backup.py", "app.py")
        print("✓ Restored simulated app.py")
    else:
        print("❌ Error: app_simulated_backup.py not found!")
        return False
    
    print("\n✅ Successfully switched back to simulated MAVLink!")
    print("\nTo use simulation:")
    print("1. Run: python app.py")
    print("2. The frontend will work with simulated data")
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "simulation":
        switch_to_simulation()
    else:
        switch_to_real_mavlink() 