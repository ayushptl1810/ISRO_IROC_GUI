import React, { useRef, useEffect, useState } from "react";
import { useSensorData } from "../context/SensorContext";

const FlightPathPlot = () => {
  const { sensorData, connectionState } = useSensorData();
  const canvasRef = useRef(null);
  const [flightPath, setFlightPath] = useState([]);
  const [centerOffset, setCenterOffset] = useState({ north: 0, east: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.fillStyle = "#374151";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;

    // Vertical grid lines (every 50 pixels = 50 meters)
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * width;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 6; i++) {
      const y = (i / 6) * height;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axis lines
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    // North-South line
    ctx.beginPath();
    ctx.moveTo(width / 2, padding);
    ctx.lineTo(width / 2, height - padding);
    ctx.stroke();
    // East-West line
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px Arial";
    ctx.fillText("North", width / 2 - 30, 20);
    ctx.fillText("South", width / 2 - 30, height - 10);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("West", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(width - 10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("East", 0, 0);
    ctx.restore();

    if (!connectionState.isConnected) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Connect to view Flight Path", width / 2, height / 2);
      return;
    }

    // Only draw flight path if connected
    if (connectionState.isConnected) {
      // Draw flight path
      if (flightPath.length > 0) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.beginPath();

        flightPath.forEach((point, index) => {
          const x = width / 2 + (point.east - centerOffset.east) * 10; // 10 pixels per meter
          const y = height / 2 - (point.north - centerOffset.north) * 10; // Invert Y for North up

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Display coordinates
        ctx.fillStyle = "#9ca3af";
        ctx.font = "10px Arial";
        ctx.textAlign = "left";
        if (flightPath.length > 0) {
          const lastPoint = flightPath[flightPath.length - 1];
          ctx.fillText(`N: ${lastPoint.north.toFixed(1)}m`, 10, height - 10);
          ctx.fillText(`E: ${lastPoint.east.toFixed(1)}m`, 10, height - 25);
        } else {
          ctx.fillText(`N: ${centerOffset.north.toFixed(1)}m`, 10, height - 10);
        }
        // Draw current position (center dot)
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw coordinates
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.fillText(`N: ${centerOffset.north.toFixed(1)}m`, 10, height - 40);
        ctx.fillText(`E: ${centerOffset.east.toFixed(1)}m`, 10, height - 25);
      }
    }
  }, [flightPath, centerOffset, connectionState.isConnected]);

  // Update flight path when GPS data changes
  useEffect(() => {
    if (
      connectionState.isConnected &&
      sensorData?.G?.latitude &&
      sensorData?.G?.longitude
    ) {
      // Convert GPS to NED coordinates (simplified)
      // In a real implementation, you'd use proper coordinate transformation
      const lat = sensorData.G.latitude;
      const lon = sensorData.G.longitude;

      // Simple conversion for demo (not accurate but shows the concept)
      const north = (lat - 28.6139) * 111000; // Rough conversion to meters
      const east = (lon - 77.209) * 111000 * Math.cos((lat * Math.PI) / 180);

      setFlightPath((prev) => [...prev, { north, east }]);
    }
  }, [
    sensorData?.G?.latitude,
    sensorData?.G?.longitude,
    connectionState.isConnected,
  ]);

  const handleReset = () => {
    if (
      connectionState.isConnected &&
      sensorData?.G?.latitude &&
      sensorData?.G?.longitude
    ) {
      const lat = sensorData.G.latitude;
      const lon = sensorData.G.longitude;

      const north = (lat - 28.6139) * 111000;
      const east = (lon - 77.209) * 111000 * Math.cos((lat * Math.PI) / 180);

      setCenterOffset({ north, east });
      setFlightPath([]);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-white">
      <h2 className="text-base font-semibold text-green-400 mb-4 text-center">
        Flight Path (NED Frame)
      </h2>
      <canvas
        ref={canvasRef}
        width={450}
        height={300}
        className="w-full h-auto bg-gray-700 rounded mb-4"
      />
      <button
        onClick={handleReset}
        disabled={!connectionState.isConnected}
        className="w-full bg-red-600 text-white rounded py-2 text-sm font-medium disabled:opacity-50"
      >
        Reset Center
      </button>
    </div>
  );
};

export default FlightPathPlot;
