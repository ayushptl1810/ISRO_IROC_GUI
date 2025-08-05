import React, { useRef, useEffect } from "react";
import { useSensorData } from "../context/SensorContext";

const LidarPlot = () => {
  const { sensorData, historicalData } = useSensorData();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#374151";
    ctx.fillRect(0, 0, width, height);

    // Get lidar data (assuming D0 and D1 are lidar sensors)
    const lidarData = historicalData.values;
    const timestamps = historicalData.timestamps;

    if (timestamps.length === 0) return;

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

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw grid
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i / 5) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw data lines
    const drawLine = (data, color) => {
      if (data.length === 0) return;

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
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText("Lidar 1", padding, 20);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(padding + 60, 10, 20, 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Lidar 2", padding + 90, 20);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(padding + 150, 10, 20, 10);

    // Draw axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px Arial";
    ctx.fillText("Time", width / 2, height - 10);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Distance (cm)", 0, 0);
    ctx.restore();
  }, [historicalData]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Lidar Distance Over Time</h2>
      <canvas ref={canvasRef} width={400} height={300} style={styles.canvas} />
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#1f2937",
    borderRadius: "0.5rem",
    padding: "1rem",
    border: "1px solid #374151",
    color: "#ffffff",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#4ade80",
    marginBottom: "1rem",
    textAlign: "center",
  },
  canvas: {
    width: "100%",
    height: "auto",
    backgroundColor: "#374151",
    borderRadius: "0.25rem",
  },
};

export default LidarPlot;
