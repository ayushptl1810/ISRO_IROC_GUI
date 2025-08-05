import React from "react";
import { useSensorData } from "../context/SensorContext";

const SensorValue = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-gray-400 font-medium">{label}</span>
    <span className="font-mono text-sm text-white">{value || "---"}</span>
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

  // Helper function to format battery voltage (first element in voltages list)
  const formatBatteryVoltage = (voltage) => {
    if (voltage === null || voltage === undefined) return "---";
    return (voltage / 1000).toFixed(3); // Convert 12345 to 12.345
  };

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
              value={formatBatteryVoltage(sensorData?.voltages?.[0])}
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

        {/* Optical Flow */}
        <SensorSection title="Optical Flow">
          <div className="space-y-2">
            <SensorValue
              label="Flow Com MX"
              value={formatValue(sensorData?.OPTICAL_FLOW?.flow_com_mx)}
            />
            <SensorValue
              label="Flow Com MY"
              value={formatValue(sensorData?.OPTICAL_FLOW?.flow_com_my)}
            />
            <SensorValue
              label="Flow Rate X"
              value={formatValue(sensorData?.OPTICAL_FLOW?.flow_rate_x)}
            />
            <SensorValue
              label="Flow Rate Y"
              value={formatValue(sensorData?.OPTICAL_FLOW?.flow_rate_y)}
            />
            <SensorValue
              label="Quality"
              value={formatValue(sensorData?.OPTICAL_FLOW?.quality)}
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
