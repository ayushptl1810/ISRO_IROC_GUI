import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const SensorContext = createContext(null);

export const useSensorData = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error("useSensorData must be used within a SensorProvider");
  }
  return context;
};

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState({
    // Battery Status - first element in voltages list
    voltages: [12345, 12340, 12335, 12330],

    // EKF Status Reports
    EKF_STATUS_REPORTS: {
      flags: 12345,
    },

    // Optical Flow Data
    OPTICAL_FLOW: {
      flow_com_mx: 12.345,
      flow_com_my: -8.765,
      flow_rate_x: 0.123,
      flow_rate_y: -0.045,
      quality: 85.0,
    },

    // Vision Position Estimate
    VISION_POSITION_ESTIMATE: {
      x: 1.234,
      y: -0.567,
      z: 2.89,
    },

    // Vision Speed Estimate
    VISION_SPEED_ESTIMATE: {
      x: 0.123,
      y: -0.045,
    },

    // Legacy data for existing plots
    D0: 150.5,
    D1: 245.2,
    F: {
      flow_x: 12.3,
      flow_y: -8.7,
      quality: 85,
    },
    I: {
      A: {
        xacc: 0.12,
        yacc: -0.05,
        zacc: 9.81,
      },
      G: {
        xgyro: 0.02,
        ygyro: -0.01,
        zgyro: 0.03,
      },
    },
    G: {
      latitude: 28.6139,
      longitude: 77.209,
      altitude_m: 216.5,
      satellites_visible: 8,
    },
  });

  // Generate initial historical data
  const generateHistoricalData = () => {
    const now = Date.now();
    const timestamps = [];
    const values = {
      D0: [],
      D1: [],
      F: [],
      I: [],
      G: [],
    };

    // Generate 60 seconds of historical data
    for (let i = 60; i >= 0; i--) {
      const timestamp = now - i * 1000;
      timestamps.push(timestamp);

      // Generate random values for D0 and D1 (lidar/distance sensors)
      values.D0.push(150 + Math.random() * 100); // 150-250 range
      values.D1.push(200 + Math.random() * 150); // 200-350 range

      // Other sensors (empty for now)
      values.F.push(null);
      values.I.push(null);
      values.G.push(null);
    }

    return { timestamps, values };
  };

  const [historicalData, setHistoricalData] = useState(
    generateHistoricalData()
  );

  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    port: "/dev/tty.usbserial-0001",
    baudRate: 115200,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [timeWindow, setTimeWindow] = useState(60);
  const [socket, setSocket] = useState(null);

  // Sample flight path data (circular pattern)
  const [flightStep, setFlightStep] = useState(0);
  const flightPattern = [
    { lat: 28.6139, lon: 77.209 }, // Start position
    { lat: 28.614, lon: 77.2091 }, // North-East
    { lat: 28.6141, lon: 77.2092 }, // Continue NE
    { lat: 28.6142, lon: 77.2091 }, // North
    { lat: 28.6143, lon: 77.209 }, // North-West
    { lat: 28.6142, lon: 77.2089 }, // West
    { lat: 28.6141, lon: 77.2088 }, // South-West
    { lat: 28.614, lon: 77.2089 }, // South
    { lat: 28.6139, lon: 77.209 }, // Back to start
  ];

  // Mock data update function
  const updateMockData = useCallback(() => {
    const timestamp = Date.now();

    // Update flight pattern
    const currentFlightStep = flightStep % flightPattern.length;
    const nextFlightStep = (flightStep + 1) % flightPattern.length;
    const currentPos = flightPattern[currentFlightStep];
    const nextPos = flightPattern[nextFlightStep];

    // Interpolate between positions for smooth movement
    const progress = (timestamp % 1000) / 1000; // 0 to 1 over 1 second
    const lat = currentPos.lat + (nextPos.lat - currentPos.lat) * progress;
    const lon = currentPos.lon + (nextPos.lon - currentPos.lon) * progress;

    setSensorData((prev) => ({
      // Update new sensor readings
      voltages: [
        prev.voltages[0] + (Math.random() - 0.5) * 10,
        prev.voltages[1] + (Math.random() - 0.5) * 10,
        prev.voltages[2] + (Math.random() - 0.5) * 10,
        prev.voltages[3] + (Math.random() - 0.5) * 10,
      ],
      EKF_STATUS_REPORTS: {
        flags: prev.EKF_STATUS_REPORTS.flags + (Math.random() > 0.5 ? 1 : -1),
      },
      OPTICAL_FLOW: {
        flow_com_mx:
          prev.OPTICAL_FLOW.flow_com_mx + (Math.random() - 0.5) * 0.1,
        flow_com_my:
          prev.OPTICAL_FLOW.flow_com_my + (Math.random() - 0.5) * 0.1,
        flow_rate_x:
          prev.OPTICAL_FLOW.flow_rate_x + (Math.random() - 0.5) * 0.01,
        flow_rate_y:
          prev.OPTICAL_FLOW.flow_rate_y + (Math.random() - 0.5) * 0.01,
        quality: Math.max(
          50,
          Math.min(100, prev.OPTICAL_FLOW.quality + (Math.random() - 0.5) * 2)
        ),
      },
      VISION_POSITION_ESTIMATE: {
        x: prev.VISION_POSITION_ESTIMATE.x + (Math.random() - 0.5) * 0.1,
        y: prev.VISION_POSITION_ESTIMATE.y + (Math.random() - 0.5) * 0.1,
        z: prev.VISION_POSITION_ESTIMATE.z + (Math.random() - 0.5) * 0.1,
      },
      VISION_SPEED_ESTIMATE: {
        x: prev.VISION_SPEED_ESTIMATE.x + (Math.random() - 0.5) * 0.01,
        y: prev.VISION_SPEED_ESTIMATE.y + (Math.random() - 0.5) * 0.01,
      },

      // Legacy data updates
      D0: prev.D0 + (Math.random() - 0.5) * 10,
      D1: prev.D1 + (Math.random() - 0.5) * 10,
      F: {
        flow_x: prev.F.flow_x + (Math.random() - 0.5) * 2,
        flow_y: prev.F.flow_y + (Math.random() - 0.5) * 2,
        quality: Math.max(
          50,
          Math.min(100, prev.F.quality + (Math.random() - 0.5) * 10)
        ),
      },
      I: {
        A: {
          xacc: prev.I.A.xacc + (Math.random() - 0.5) * 0.1,
          yacc: prev.I.A.yacc + (Math.random() - 0.5) * 0.1,
          zacc: prev.I.A.zacc + (Math.random() - 0.5) * 0.1,
        },
        G: {
          xgyro: prev.I.G.xgyro + (Math.random() - 0.5) * 0.01,
          ygyro: prev.I.G.ygyro + (Math.random() - 0.5) * 0.01,
          zgyro: prev.I.G.zgyro + (Math.random() - 0.5) * 0.01,
        },
      },
      G: {
        latitude: lat,
        longitude: lon,
        altitude_m: prev.G.altitude_m + (Math.random() - 0.5) * 2,
        satellites_visible: Math.max(
          4,
          Math.min(
            12,
            prev.G.satellites_visible + (Math.random() > 0.5 ? 1 : -1)
          )
        ),
      },
    }));

    // Update historical data
    setHistoricalData((prev) => {
      const newTimestamps = [...prev.timestamps, timestamp];
      const newValues = { ...prev.values };

      // Keep only last timeWindow seconds of data
      const cutoffTime = timestamp - timeWindow * 1000;
      const validIndices = newTimestamps
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t >= cutoffTime)
        .map(({ i }) => i);

      // Update D0 and D1 with new values
      newValues.D0 = [
        ...prev.values.D0.filter((_, i) => validIndices.includes(i)),
        sensorData.D0 + (Math.random() - 0.5) * 10,
      ];
      newValues.D1 = [
        ...prev.values.D1.filter((_, i) => validIndices.includes(i)),
        sensorData.D1 + (Math.random() - 0.5) * 10,
      ];

      return {
        timestamps: newTimestamps.filter((_, i) => validIndices.includes(i)),
        values: newValues,
      };
    });

    // Update flight step every second
    if (timestamp % 1000 < 100) {
      // Update step roughly every second
      setFlightStep((prev) => prev + 1);
    }
  }, [sensorData, timeWindow, flightStep]);

  // Mock connection functions
  const connect = useCallback(
    (port, baudRate) => {
      console.log("Mock: Connecting to", port, "at", baudRate);
      setConnectionState({ isConnected: true, port, baudRate });
      setIsMonitoring(true);

      // Start mock data updates
      const interval = setInterval(updateMockData, 100); // Update more frequently for smooth movement
      setSocket({ disconnect: () => clearInterval(interval) });
    },
    [updateMockData]
  );

  const disconnect = useCallback(() => {
    console.log("Mock: Disconnecting");
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setConnectionState((prev) => ({ ...prev, isConnected: false }));
    setIsMonitoring(false);
  }, [socket]);

  const resetData = useCallback(() => {
    console.log("Mock: Resetting data");
    setSensorData({
      // Reset new sensor readings
      voltages: [12345, 12340, 12335, 12330],
      EKF_STATUS_REPORTS: {
        flags: 12345,
      },
      OPTICAL_FLOW: {
        flow_com_mx: 12.345,
        flow_com_my: -8.765,
        flow_rate_x: 0.123,
        flow_rate_y: -0.045,
        quality: 85.0,
      },
      VISION_POSITION_ESTIMATE: {
        x: 1.234,
        y: -0.567,
        z: 2.89,
      },
      VISION_SPEED_ESTIMATE: {
        x: 0.123,
        y: -0.045,
      },

      // Reset legacy data
      D0: 150.5,
      D1: 245.2,
      F: {
        flow_x: 12.3,
        flow_y: -8.7,
        quality: 85,
      },
      I: {
        A: {
          xacc: 0.12,
          yacc: -0.05,
          zacc: 9.81,
        },
        G: {
          xgyro: 0.02,
          ygyro: -0.01,
          zgyro: 0.03,
        },
      },
      G: {
        latitude: 28.6139,
        longitude: 77.209,
        altitude_m: 216.5,
        satellites_visible: 8,
      },
    });
    setHistoricalData(generateHistoricalData());
    setFlightStep(0);
  }, []);

  const startMonitoring = useCallback(() => {
    console.log("Mock: Starting monitoring");
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    console.log("Mock: Stopping monitoring");
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    sensorData,
    historicalData,
    connectionState,
    isMonitoring,
    timeWindow,
    connect,
    disconnect,
    startMonitoring,
    stopMonitoring,
    resetData,
    setTimeWindow,
  };

  return (
    <SensorContext.Provider value={value}>{children}</SensorContext.Provider>
  );
};
