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
    yaw: null, // Add yaw from AHRS2
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
  const [eventSources, setEventSources] = useState({});

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

  // Function to connect to backend streams
  const connectToBackendStreams = useCallback(() => {
    console.log("Connecting to backend streams...");

    const sources = {};

    // Battery status stream
    sources.battery = new EventSource(
      "http://localhost:8000/stream/BATTERY_STATUS"
    );
    sources.battery.onmessage = (event) => {
      console.log("Battery data received:", event.data);
      const data = JSON.parse(event.data);
      setSensorData((prev) => ({
        ...prev,
        voltages: data.voltages,
      }));
    };
    sources.battery.onopen = () => console.log("Battery stream connected");
    sources.battery.onerror = (error) =>
      console.log("Battery stream error:", error);

    // EKF status stream
    sources.ekf = new EventSource(
      "http://localhost:8000/stream/EKF_STATUS_REPORT"
    );
    sources.ekf.onmessage = (event) => {
      console.log("EKF data received:", event.data);
      const data = JSON.parse(event.data);
      setSensorData((prev) => ({
        ...prev,
        EKF_STATUS_REPORTS: { flags: data.flags },
      }));
    };
    sources.ekf.onopen = () => console.log("EKF stream connected");
    sources.ekf.onerror = (error) => console.log("EKF stream error:", error);

    // Vision position estimate stream
    sources.visionPosition = new EventSource(
      "http://localhost:8000/stream/VISION_POSITION_ESTIMATE"
    );
    sources.visionPosition.onmessage = (event) => {
      console.log("Vision position data received:", event.data);
      const data = JSON.parse(event.data);
      setSensorData((prev) => ({
        ...prev,
        VISION_POSITION_ESTIMATE: { x: data.x, y: data.y, z: data.z },
      }));
    };
    sources.visionPosition.onopen = () =>
      console.log("Vision position stream connected");
    sources.visionPosition.onerror = (error) =>
      console.log("Vision position stream error:", error);

    // Vision speed estimate stream
    sources.visionSpeed = new EventSource(
      "http://localhost:8000/stream/VISION_SPEED_ESTIMATE"
    );
    sources.visionSpeed.onmessage = (event) => {
      console.log("Vision speed data received:", event.data);
      const data = JSON.parse(event.data);
      setSensorData((prev) => ({
        ...prev,
        VISION_SPEED_ESTIMATE: { x: data.x, y: data.y },
      }));
    };
    sources.visionSpeed.onopen = () =>
      console.log("Vision speed stream connected");
    sources.visionSpeed.onerror = (error) =>
      console.log("Vision speed stream error:", error);

    // Distance sensor D0 stream
    sources.distance0 = new EventSource(
      "http://localhost:8000/stream/distance_sensor/0"
    );
    sources.distance0.onmessage = (event) => {
      console.log("Distance D0 data received:", event.data);
      const data = JSON.parse(event.data);
      const timestamp = Date.now();

      setSensorData((prev) => ({
        ...prev,
        D0: data.current_distance,
      }));

      // Update historical data
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
          data.current_distance,
        ];

        return {
          timestamps: newTimestamps.filter((_, i) => validIndices.includes(i)),
          values: newValues,
        };
      });
    };
    sources.distance0.onopen = () =>
      console.log("Distance D0 stream connected");
    sources.distance0.onerror = (error) =>
      console.log("Distance D0 stream error:", error);

    // Distance sensor D1 stream
    sources.distance1 = new EventSource(
      "http://localhost:8000/stream/distance_sensor/1"
    );
    sources.distance1.onmessage = (event) => {
      console.log("Distance D1 data received:", event.data);
      const data = JSON.parse(event.data);
      const timestamp = Date.now();

      setSensorData((prev) => ({
        ...prev,
        D1: data.current_distance,
      }));

      // Update historical data
      setHistoricalData((prev) => {
        const newTimestamps = [...prev.timestamps, timestamp];
        const newValues = { ...prev.values };
        const cutoffTime = timestamp - timeWindow * 1000;
        const validIndices = newTimestamps
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => t >= cutoffTime)
          .map(({ i }) => i);

        newValues.D1 = [
          ...prev.values.D1.filter((_, i) => validIndices.includes(i)),
          data.current_distance,
        ];

        return {
          timestamps: newTimestamps.filter((_, i) => validIndices.includes(i)),
          values: newValues,
        };
      });
    };
    sources.distance1.onopen = () =>
      console.log("Distance D1 stream connected");
    sources.distance1.onerror = (error) =>
      console.log("Distance D1 stream error:", error);

    // 3D plot data stream (accumulated data)
    sources.threeDPlot = new EventSource(
      "http://localhost:8000/stream/3d_plot"
    );
    sources.threeDPlot.onmessage = (event) => {
      console.log("3D plot data received:", event.data);
      const data = JSON.parse(event.data);
      // Store the accumulated 3D plot data
      setSensorData((prev) => ({
        ...prev,
        threeDPlotData: data,
      }));
    };
    sources.threeDPlot.onopen = () => console.log("3D plot stream connected");
    sources.threeDPlot.onerror = (error) =>
      console.log("3D plot stream error:", error);

    setEventSources(sources);
  }, [timeWindow]);

  // Function to disconnect from backend streams
  const disconnectFromBackendStreams = useCallback(() => {
    Object.values(eventSources).forEach((source) => {
      if (source) {
        source.close();
      }
    });
    setEventSources({});
  }, [eventSources]);

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
        yaw: (prev.yaw || 0.5) + (Math.random() - 0.5) * 0.1,
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
      console.log("Connecting to", port, "at", baudRate);
      setConnectionState({ isConnected: true, port, baudRate });
      setIsMonitoring(true);

      // Try to connect to backend streams first
      connectToBackendStreams();
    },
    [connectToBackendStreams]
  );

  const disconnect = useCallback(() => {
    console.log("Disconnecting");
    disconnectFromBackendStreams();
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setConnectionState((prev) => ({ ...prev, isConnected: false }));
    setIsMonitoring(false);

    // Clear all sensor data and historical data when disconnected
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
      yaw: null,
    });
    setHistoricalData({
      timestamps: [],
      values: { D0: [], D1: [], F: [], I: [], G: [] },
    });
    setFlightStep(0);
  }, [socket, disconnectFromBackendStreams]);

  const resetData = useCallback(() => {
    console.log("Resetting data");
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
      yaw: null,
    });
    setHistoricalData({
      timestamps: [],
      values: { D0: [], D1: [], F: [], I: [], G: [] },
    });
    setFlightStep(0);
  }, []);

  const startMonitoring = useCallback(() => {
    console.log("Starting monitoring");
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    console.log("Stopping monitoring");
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnectFromBackendStreams();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket, disconnectFromBackendStreams]);

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
