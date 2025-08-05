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
  const { sensorData } = useSensorData();

  // Helper function to format values to 3 decimal places
  const formatValue = (value) => {
    if (value === null || value === undefined) return "---";
    return typeof value === "number" ? value.toFixed(3) : value;
  };

  // Helper function to format battery voltage and determine color
  const formatBatteryVoltage = (voltage) => {
    if (voltage === null || voltage === undefined)
      return { value: "---", color: "text-white" };
    const formattedVoltage = (voltage / 1000).toFixed(3);
    const color =
      parseFloat(formattedVoltage) < 15 ? "text-red-500" : "text-green-500";
    return { value: formattedVoltage, color };
  };

  // Function to calculate terrain angle
  const calculateTerrainAngle = (d0, d1, separation) => {
    if (d0 === null || d1 === null || d0 === undefined || d1 === undefined) {
      return { value: "---", color: "text-white" };
    }
    const deltaD = Math.abs(d0 - d1);
    if (separation === 0) {
      return { value: "0.000", color: "text-green-500" };
    }
    const thetaRad = Math.atan(deltaD / separation);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    const color = thetaDeg > 15 ? "text-red-500" : "text-green-500";
    return { value: thetaDeg.toFixed(3), color };
  };

  const battery = formatBatteryVoltage(sensorData?.voltages?.[0]);
  const terrainAngle = calculateTerrainAngle(
    sensorData?.D0,
    sensorData?.D1,
    21
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#4ade80",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        Live Sensor Readings
      </h2>

      <div className="space-y-4">
        {/* Battery Status */}
        <SensorSection title="Battery Status">
          <div className="space-y-2">
            <SensorValue
              label="Voltage"
              value={`${battery.value} V`}
              color={battery.color}
            />
          </div>
        </SensorSection>

        {/* Terrain Angle */}
        <SensorSection title="Terrain Angle">
          <div className="space-y-2">
            <SensorValue
              label="Angle"
              value={`${terrainAngle.value}°`}
              color={terrainAngle.color}
            />
          </div>
        </SensorSection>

        {/* EKF Status Reports */}
        <SensorSection title="EKF Status Reports">
          <div className="space-y-2">
            <SensorValue
              label="Flags"
              value={sensorData?.EKF_STATUS_REPORTS?.flags || "---"}
            />
          </div>
        </SensorSection>

        {/* Vision Position Estimate */}
        <SensorSection title="Vision Position Estimate">
          <div className="space-y-2">
            <SensorValue
              label="X"
              value={formatValue(sensorData?.VISION_POSITION_ESTIMATE?.x)}
            />
            <SensorValue
              label="Y"
              value={formatValue(sensorData?.VISION_POSITION_ESTIMATE?.y)}
            />
            <SensorValue
              label="Z"
              value={formatValue(sensorData?.VISION_POSITION_ESTIMATE?.z)}
            />
          </div>
        </SensorSection>

        {/* Vision Speed Estimate */}
        <SensorSection title="Vision Speed Estimate">
          <div className="space-y-2">
            <SensorValue
              label="X"
              value={formatValue(sensorData?.VISION_SPEED_ESTIMATE?.x)}
            />
            <SensorValue
              label="Y"
              value={formatValue(sensorData?.VISION_SPEED_ESTIMATE?.y)}
            />
          </div>
        </SensorSection>
      </div>
    </div>
  );
};
