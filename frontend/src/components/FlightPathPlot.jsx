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
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 6; i++) {
      const y = (i / 6) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw center cross
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
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

    // Draw scale indicator (1 meter = 10 pixels)
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px Arial";
    ctx.fillText("Scale: 1m = 10px", 10, 20);

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

        // Draw path points
        flightPath.forEach((point) => {
          const x = width / 2 + (point.east - centerOffset.east) * 10;
          const y = height / 2 - (point.north - centerOffset.north) * 10;

          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
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
    <div style={styles.container}>
      <h2 style={styles.title}>Flight Path (NED Frame)</h2>
      <canvas ref={canvasRef} width={400} height={300} style={styles.canvas} />
      <button
        onClick={handleReset}
        disabled={!connectionState.isConnected}
        style={{
          ...styles.resetButton,
          opacity: connectionState.isConnected ? 1 : 0.5,
        }}
      >
        Reset Center
      </button>
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
    marginBottom: "1rem",
  },
  resetButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.25rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
  },
};

export default FlightPathPlot;
