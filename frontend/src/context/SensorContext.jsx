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
    // Initialize with null or empty values
    voltages: [],
    EKF_STATUS_REPORTS: { flags: null },
    VISION_POSITION_ESTIMATE: { x: null, y: null, z: null },
    VISION_SPEED_ESTIMATE: { x: null, y: null },
    D0: null,
    D1: null,
    I: {
      A: { xacc: null, yacc: null, zacc: null },
      G: { xgyro: null, ygyro: null, zgyro: null },
    },
    G: {
      latitude: null,
      longitude: null,
      altitude_m: null,
      satellites_visible: null,
    },
    F: { flow_x: null, flow_y: null, quality: null },
  });

  const [historicalData, setHistoricalData] = useState({
    timestamps: [],
    values: { D0: [], D1: [], F: [], I: [], G: [] },
  });

  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    port: "/dev/tty.usbserial-0001",
    baudRate: 115200,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [timeWindow, setTimeWindow] = useState(60);
  const [socket, setSocket] = useState(null);
  const [flightStep, setFlightStep] = useState(0);

  const flightPattern = [
    { lat: 28.6139, lon: 77.209 },
    { lat: 28.614, lon: 77.2091 },
    { lat: 28.6141, lon: 77.2092 },
    { lat: 28.6142, lon: 77.2091 },
    { lat: 28.6143, lon: 77.209 },
    { lat: 28.6142, lon: 77.2089 },
    { lat: 28.6141, lon: 77.2088 },
    { lat: 28.614, lon: 77.2089 },
    { lat: 28.6139, lon: 77.209 },
  ];

  const updateMockData = useCallback(() => {
    const timestamp = Date.now();
    const currentFlightStep = flightStep % flightPattern.length;
    const nextFlightStep = (flightStep + 1) % flightPattern.length;
    const currentPos = flightPattern[currentFlightStep];
    const nextPos = flightPattern[nextFlightStep];
    const progress = (timestamp % 1000) / 1000;
    const lat = currentPos.lat + (nextPos.lat - currentPos.lat) * progress;
    const lon = currentPos.lon + (nextPos.lon - currentPos.lon) * progress;

    setSensorData((prev) => {
      // If data is null, initialize with a starting value
      const D0 =
        prev.D0 === null ? 150.5 : prev.D0 + (Math.random() - 0.5) * 10;
      const D1 =
        prev.D1 === null ? 245.2 : prev.D1 + (Math.random() - 0.5) * 10;

      return {
        voltages: [12345, 12340, 12335, 12330],
        EKF_STATUS_REPORTS: {
          flags:
            (prev.EKF_STATUS_REPORTS.flags || 0) +
            (Math.random() > 0.5 ? 1 : -1),
        },
        VISION_POSITION_ESTIMATE: {
          x:
            (prev.VISION_POSITION_ESTIMATE.x || 1.234) +
            (Math.random() - 0.5) * 0.1,
          y:
            (prev.VISION_POSITION_ESTIMATE.y || -0.567) +
            (Math.random() - 0.5) * 0.1,
          z:
            (prev.VISION_POSITION_ESTIMATE.z || 2.89) +
            (Math.random() - 0.5) * 0.1,
        },
        VISION_SPEED_ESTIMATE: {
          x:
            (prev.VISION_SPEED_ESTIMATE.x || 0.123) +
            (Math.random() - 0.5) * 0.01,
          y:
            (prev.VISION_SPEED_ESTIMATE.y || -0.045) +
            (Math.random() - 0.5) * 0.01,
        },
        D0,
        D1,
        I: {
          A: {
            xacc: (prev.I.A.xacc || 0.12) + (Math.random() - 0.5) * 0.1,
            yacc: (prev.I.A.yacc || -0.05) + (Math.random() - 0.5) * 0.1,
            zacc: (prev.I.A.zacc || 9.81) + (Math.random() - 0.5) * 0.1,
          },
          G: {
            xgyro: (prev.I.G.xgyro || 0.02) + (Math.random() - 0.5) * 0.01,
            ygyro: (prev.I.G.ygyro || -0.01) + (Math.random() - 0.5) * 0.01,
            zgyro: (prev.I.G.zgyro || 0.03) + (Math.random() - 0.5) * 0.01,
          },
        },
        G: {
          latitude: lat,
          longitude: lon,
          altitude_m: (prev.G.altitude_m || 216.5) + (Math.random() - 0.5) * 2,
          satellites_visible: Math.max(
            4,
            Math.min(
              12,
              (prev.G.satellites_visible || 8) + (Math.random() > 0.5 ? 1 : -1)
            )
          ),
        },
        F: {
          flow_x: (prev.F.flow_x || 12.3) + (Math.random() - 0.5) * 2,
          flow_y: (prev.F.flow_y || -8.7) + (Math.random() - 0.5) * 2,
          quality: Math.max(
            50,
            Math.min(100, (prev.F.quality || 85) + (Math.random() - 0.5) * 10)
          ),
        },
      };
    });

    setHistoricalData((prev) => {
      const newTimestamps = [...prev.timestamps, timestamp];
      const newValues = { ...prev.values };
      const cutoffTime = timestamp - timeWindow * 1000;
      const validIndices = newTimestamps
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t >= cutoffTime)
        .map(({ i }) => i);

      newValues.D0 = [
        ...prev.values.D0.filter((_, i) => validIndices.includes(i)),
        sensorData.D0,
      ];
      newValues.D1 = [
        ...prev.values.D1.filter((_, i) => validIndices.includes(i)),
        sensorData.D1,
      ];

      return {
        timestamps: newTimestamps.filter((_, i) => validIndices.includes(i)),
        values: newValues,
      };
    });

    if (timestamp % 1000 < 100) {
      setFlightStep((prev) => prev + 1);
    }
  }, [sensorData, timeWindow, flightStep]);

  const connect = useCallback(
    (port, baudRate) => {
      console.log("Mock: Connecting to", port, "at", baudRate);
      setConnectionState({ isConnected: true, port, baudRate });
      setIsMonitoring(true);
      const interval = setInterval(updateMockData, 100);
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
      voltages: [],
      EKF_STATUS_REPORTS: { flags: null },
      VISION_POSITION_ESTIMATE: { x: null, y: null, z: null },
      VISION_SPEED_ESTIMATE: { x: null, y: null },
      D0: null,
      D1: null,
      I: {
        A: { xacc: null, yacc: null, zacc: null },
        G: { xgyro: null, ygyro: null, zgyro: null },
      },
      G: {
        latitude: null,
        longitude: null,
        altitude_m: null,
        satellites_visible: null,
      },
      F: { flow_x: null, flow_y: null, quality: null },
    });
    setHistoricalData({
      timestamps: [],
      values: { D0: [], D1: [], F: [], I: [], G: [] },
    });
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
