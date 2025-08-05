import React, { useRef, useEffect } from "react";
import { useSensorData } from "../context/SensorContext";

const LidarPlot = () => {
  const { sensorData, historicalData, connectionState } = useSensorData();
  const canvasRef = useRef(null);

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

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * (width - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * (height - 2 * padding);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Time", width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Distance (cm)", 0, 0);
    ctx.restore();

    if (!connectionState.isConnected) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Connect to view Lidar Data", width / 2, height / 2);
      return;
    }

    const lidarData = historicalData.values;
    const timestamps = historicalData.timestamps;

    if (timestamps.length < 2) return;

    // Calculate scales
    const timeRange = timestamps[timestamps.length - 1] - timestamps[0];
    const maxValue = Math.max(
      ...lidarData.D0.filter((v) => v !== null),
      ...lidarData.D1.filter((v) => v !== null)
    );
    const minValue = Math.min(
      ...lidarData.D0.filter((v) => v !== null),
      ...lidarData.D1.filter((v) => v !== null)
    );

    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw data lines
    const drawLine = (data, color) => {
      if (data.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((value, index) => {
        if (value === null) return;

        const x =
          padding +
          ((timestamps[index] - timestamps[0]) / timeRange) * chartWidth;
        const y =
          height -
          padding -
          ((value - minValue) / (maxValue - minValue)) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    };

    // Draw lidar data
    drawLine(lidarData.D0, "#3b82f6"); // Blue for Lidar 1
    drawLine(lidarData.D1, "#ef4444"); // Red for Lidar 2

    // Draw legend
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText("Lidar 1", padding + 10, 25);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(padding - 5, 15, 10, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Lidar 2", padding + 80, 25);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(padding + 65, 15, 10, 10);
  }, [historicalData, connectionState.isConnected]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-white">
      <h2 className="text-base font-semibold text-green-400 mb-4 text-center">
        Lidar Distance Over Time
      </h2>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-auto bg-gray-700 rounded"
      />
    </div>
  );
};

export default LidarPlot;
