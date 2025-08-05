import React from "react";
import { useSensorData } from "../context/SensorContext";

const UAVAlignment = () => {
  const { sensorData, connectionState } = useSensorData();
  const ROLL_TOLERANCE = 5;
  const PITCH_TOLERANCE = 5;

  // Use AHRS2 values instead of IMU gyroscope data
  const rollRadians = parseFloat(sensorData?.AHRS2?.roll || 0);
  const pitchRadians = parseFloat(sensorData?.AHRS2?.pitch || 0);
  const yawRadians = parseFloat(sensorData?.AHRS2?.yaw || 0);

  // Convert radians to degrees
  const roll = Math.min(Math.max((rollRadians * 180) / Math.PI, -45), 45);
  const pitch = Math.min(Math.max((pitchRadians * 180) / Math.PI, -45), 45);
  const yaw = (yawRadians * 180) / Math.PI;

  const isRollStable = Math.abs(roll) <= ROLL_TOLERANCE;
  const isPitchStable = Math.abs(pitch) <= PITCH_TOLERANCE;

  // Check if we should show data or "---"
  const shouldShowData = connectionState.isConnected;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-white">
      <h2 className="text-base font-semibold text-green-400 mb-4 text-center">
        UAV Alignment
      </h2>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 bg-gray-700 rounded-lg border border-gray-600 mb-4">
          <div
            className="absolute w-full h-0.5 bg-blue-500 top-1/2 transform-origin-center"
            style={{ transform: `translateY(-50%) rotate(${roll}deg)` }}
          />
          <div
            className="absolute w-0.5 h-full bg-red-500 left-1/2 transform-origin-center"
            style={{ transform: `translateX(-50%) rotate(${pitch}deg)` }}
          />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-full h-full border border-gray-600 rounded-full" />
            <div className="absolute w-3/4 h-3/4 border border-gray-600 rounded-full" />
            <div className="absolute w-1/2 h-1/2 border border-gray-600 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Roll</div>
            <div className="font-mono text-sm font-semibold text-white">
              {shouldShowData ? `${roll.toFixed(1)}°` : "---"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Pitch</div>
            <div className="font-mono text-sm font-semibold text-white">
              {shouldShowData ? `${pitch.toFixed(1)}°` : "---"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Yaw</div>
            <div className="font-mono text-sm font-semibold text-white">
              {shouldShowData ? `${yaw.toFixed(1)}°` : "---"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div
            className={`px-3 py-2 rounded text-sm font-medium text-white text-center ${
              shouldShowData
                ? isRollStable
                  ? "bg-green-600"
                  : "bg-red-600"
                : "bg-gray-600"
            }`}
          >
            Roll{" "}
            {shouldShowData ? (isRollStable ? "Stable" : "Unstable") : "---"}
          </div>
          <div
            className={`px-3 py-2 rounded text-sm font-medium text-white text-center ${
              shouldShowData
                ? isPitchStable
                  ? "bg-green-600"
                  : "bg-red-600"
                : "bg-gray-600"
            }`}
          >
            Pitch{" "}
            {shouldShowData ? (isPitchStable ? "Stable" : "Unstable") : "---"}
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center">
          Tolerance: ±{ROLL_TOLERANCE}°
        </div>
      </div>
    </div>
  );
};

export default UAVAlignment;
