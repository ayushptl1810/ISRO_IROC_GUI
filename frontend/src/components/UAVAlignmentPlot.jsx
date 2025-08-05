import React from "react";
import { useSensorData } from "../context/SensorContext";

const UAVAlignment = () => {
  const { sensorData } = useSensorData();
  const ROLL_TOLERANCE = 5;
  const PITCH_TOLERANCE = 5;
  const gyroX = parseFloat(sensorData?.I?.G?.xgyro || 0);
  const gyroY = parseFloat(sensorData?.I?.G?.ygyro || 0);
  const gyroZ = parseFloat(sensorData?.I?.G?.zgyro || 0);
  const pitch = Math.min(Math.max(gyroY * 2, -45), 45);
  const roll = Math.min(Math.max(gyroX * 2, -45), 45);
  const isRollStable = Math.abs(roll) <= ROLL_TOLERANCE;
  const isPitchStable = Math.abs(pitch) <= PITCH_TOLERANCE;

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
              {roll.toFixed(1)}°
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Pitch</div>
            <div className="font-mono text-sm font-semibold text-white">
              {pitch.toFixed(1)}°
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Yaw</div>
            <div className="font-mono text-sm font-semibold text-white">
              {gyroZ.toFixed(1)}°/s
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div
            className={`px-3 py-2 rounded text-sm font-medium text-white text-center ${
              isRollStable ? "bg-green-600" : "bg-red-600"
            }`}
          >
            Roll {isRollStable ? "Stable" : "Unstable"}
          </div>
          <div
            className={`px-3 py-2 rounded text-sm font-medium text-white text-center ${
              isPitchStable ? "bg-green-600" : "bg-red-600"
            }`}
          >
            Pitch {isPitchStable ? "Stable" : "Unstable"}
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
