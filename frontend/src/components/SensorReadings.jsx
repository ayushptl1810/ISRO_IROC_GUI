import React from "react";
import { useSensorData } from "../context/SensorContext";

const SensorValue = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-gray-400 font-medium">{label}</span>
    <span className={`font-mono text-sm ${color || "text-white"}`}>
      {value || "---"}
    </span>
  </div>
);

const SensorSection = ({ title, children }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <h3 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
      {title}
    </h3>
    {children}
  </div>
);

export const LiveSensorReadings = () => {
  const { sensorData, connectionState } = useSensorData();

  // Helper function to format values to 3 decimal places
  const formatValue = (value) => {
    if (value === null || value === undefined) return "---";
    return Number(value).toFixed(3);
  };

  // Helper function to format battery voltage and apply color
  const formatBatteryVoltage = (voltage) => {
    if (!voltage || voltage === null || voltage === undefined) return "---";
    const voltageInVolts = voltage / 1000; // Convert millivolts to volts
    const color = voltageInVolts >= 15 ? "text-green-500" : "text-red-500";
    return { value: voltageInVolts.toFixed(3), color };
  };

  // Helper function to calculate terrain angle
  const calculateTerrainAngle = () => {
    const d0 = sensorData?.D0;
    const d1 = sensorData?.D1;
    const separation = 21;

    if (d0 === null || d1 === null || d0 === undefined || d1 === undefined) {
      return null;
    }

    const delta_d = Math.abs(d0 - d1);
    if (separation === 0) return 0.0;

    const theta_rad = Math.atan(delta_d / separation);
    const theta_deg = (theta_rad * 180) / Math.PI;
    return theta_deg;
  };

  // Check if we should show data or "---"
  const shouldShowData = connectionState.isConnected;

  const battery = formatBatteryVoltage(sensorData?.voltages?.[0]);
  const ekfFlags = sensorData?.EKF_STATUS_REPORTS?.flags;
  const visionPosition = sensorData?.VISION_POSITION_ESTIMATE;
  const visionSpeed = sensorData?.VISION_SPEED_ESTIMATE;
  const terrainAngle = calculateTerrainAngle();

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full">
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          color: "#f3f4f6",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        Live Sensor Readings
      </h2>

      <div className="space-y-4">
        {/* Battery Status */}
        <div className="bg-gray-700 rounded p-3">
          <h3 className="text-white font-medium mb-2">Battery Status</h3>
          <SensorValue
            label="Voltage"
            value={shouldShowData ? battery.value : "---"}
            color={shouldShowData ? battery.color : "text-white"}
          />
        </div>

        {/* EKF Status Reports */}
        <div className="bg-gray-700 rounded p-3">
          <h3 className="text-white font-medium mb-2">EKF Status Reports</h3>
          <SensorValue
            label="Flags"
            value={shouldShowData ? formatValue(ekfFlags) : "---"}
          />
        </div>

        {/* Vision Position Estimate */}
        <div className="bg-gray-700 rounded p-3">
          <h3 className="text-white font-medium mb-2">
            Vision Position Estimate
          </h3>
          <SensorValue
            label="X"
            value={shouldShowData ? formatValue(visionPosition?.x) : "---"}
          />
          <SensorValue
            label="Y"
            value={shouldShowData ? formatValue(visionPosition?.y) : "---"}
          />
          <SensorValue
            label="Z"
            value={shouldShowData ? formatValue(visionPosition?.z) : "---"}
          />
        </div>

        {/* Vision Speed Estimate */}
        <div className="bg-gray-700 rounded p-3">
          <h3 className="text-white font-medium mb-2">Vision Speed Estimate</h3>
          <SensorValue
            label="X"
            value={shouldShowData ? formatValue(visionSpeed?.x) : "---"}
          />
          <SensorValue
            label="Y"
            value={shouldShowData ? formatValue(visionSpeed?.y) : "---"}
          />
        </div>

        {/* Terrain Angle */}
        <div className="bg-gray-700 rounded p-3">
          <h3 className="text-white font-medium mb-2">Terrain Angle</h3>
          <SensorValue
            label="Angle"
            value={
              shouldShowData && terrainAngle !== null
                ? formatValue(terrainAngle)
                : "---"
            }
            color={
              shouldShowData && terrainAngle !== null
                ? terrainAngle > 15
                  ? "text-red-500"
                  : "text-green-500"
                : "text-white"
            }
          />
        </div>
      </div>
    </div>
  );
};
