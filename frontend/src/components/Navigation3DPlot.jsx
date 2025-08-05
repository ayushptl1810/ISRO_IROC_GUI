import React, { useEffect, useState } from "react";
import { useSensorData } from "../context/SensorContext";
import Plot from "react-plotly.js";

const Navigation3DPlot = () => {
  const { sensorData, connectionState } = useSensorData();
  const [plotData, setPlotData] = useState([]);

  // Generate sample 3D navigation data
  useEffect(() => {
    if (!connectionState.isConnected) {
      setPlotData([]);
      return;
    }

    // Generate sample navigation data with lidar readings
    const generateNavigationData = () => {
      const data = [];

      // Generate a grid of navigation points
      for (let x = -5; x <= 5; x += 0.5) {
        for (let y = -5; y <= 5; y += 0.5) {
          // Lidar ID 1 data (at x, y)
          const lidar1Distance =
            100 + Math.random() * 50 + Math.sqrt(x * x + y * y) * 10;
          data.push({
            x: x,
            y: y,
            z: lidar1Distance,
            sensor: "Lidar ID=1",
            color: "#3b82f6",
          });

          // Lidar ID 0 data (at x+0.1, y)
          const lidar0Distance =
            120 +
            Math.random() * 40 +
            Math.sqrt((x + 0.1) * (x + 0.1) + y * y) * 8;
          data.push({
            x: x + 0.1,
            y: y,
            z: lidar0Distance,
            sensor: "Lidar ID=0",
            color: "#ef4444",
          });
        }
      }

      return data;
    };

    const navigationData = generateNavigationData();

    // Separate data for Plotly
    const lidar1Data = navigationData.filter((d) => d.sensor === "Lidar ID=1");
    const lidar0Data = navigationData.filter((d) => d.sensor === "Lidar ID=0");

    const traces = [
      {
        x: lidar1Data.map((d) => d.x),
        y: lidar1Data.map((d) => d.y),
        z: lidar1Data.map((d) => d.z),
        mode: "markers",
        type: "scatter3d",
        name: "Lidar ID=1",
        marker: {
          size: 4,
          color: "#3b82f6",
          opacity: 0.8,
        },
        hovertemplate:
          "X: %{x:.2f}m<br>Y: %{y:.2f}m<br>Distance: %{z:.1f}cm<br>Sensor: Lidar ID=1<extra></extra>",
      },
      {
        x: lidar0Data.map((d) => d.x),
        y: lidar0Data.map((d) => d.y),
        z: lidar0Data.map((d) => d.z),
        mode: "markers",
        type: "scatter3d",
        name: "Lidar ID=0",
        marker: {
          size: 4,
          color: "#ef4444",
          opacity: 0.8,
        },
        hovertemplate:
          "X: %{x:.2f}m<br>Y: %{y:.2f}m<br>Distance: %{z:.1f}cm<br>Sensor: Lidar ID=0<extra></extra>",
      },
    ];

    setPlotData(traces);
  }, [connectionState.isConnected]);

  const layout = {
    scene: {
      xaxis: {
        title: "X (m)",
        titlefont: { color: "#ffffff", size: 11 },
        tickfont: { color: "#ffffff", size: 9 },
        gridcolor: "#4b5563",
        zerolinecolor: "#6b7280",
        showgrid: true,
        showline: true,
        linecolor: "#6b7280",
        range: [-6, 6],
      },
      yaxis: {
        title: "Y (m)",
        titlefont: { color: "#ffffff", size: 11 },
        tickfont: { color: "#ffffff", size: 9 },
        gridcolor: "#4b5563",
        zerolinecolor: "#6b7280",
        showgrid: true,
        showline: true,
        linecolor: "#6b7280",
        range: [-6, 6],
      },
      zaxis: {
        title: "Lidar Distance (cm)",
        titlefont: { color: "#ffffff", size: 11 },
        tickfont: { color: "#ffffff", size: 9 },
        gridcolor: "#4b5563",
        zerolinecolor: "#6b7280",
        showgrid: true,
        showline: true,
        linecolor: "#6b7280",
        range: [80, 220],
      },
      bgcolor: "#374151",
      camera: {
        eye: { x: 1.2, y: 1.2, z: 1.2 },
      },
      aspectmode: "cube",
    },
    paper_bgcolor: "#1f2937",
    plot_bgcolor: "#1f2937",
    font: { color: "#ffffff" },
    margin: { l: 60, r: 60, t: 80, b: 60 },
    legend: {
      font: { color: "#ffffff", size: 11 },
      bgcolor: "#374151",
      bordercolor: "#6b7280",
      x: 0.5,
      y: 1.02,
      xanchor: "center",
      yanchor: "bottom",
      orientation: "h",
    },
    showlegend: true,
  };

  const config = {
    displayModeBar: false,
    displaylogo: false,
    responsive: true,
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Navigation 3D Map</h2>
      <div style={styles.plotContainer}>
        {connectionState.isConnected ? (
          <Plot
            data={plotData}
            layout={layout}
            config={config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler={true}
          />
        ) : (
          <div style={styles.disconnectedMessage}>
            Connect to view 3D Navigation Map
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#1f2937",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    border: "1px solid #374151",
    color: "#ffffff",
    height: "100%",
  },
  title: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#4ade80",
    marginBottom: "0.75rem",
    textAlign: "center",
  },
  plotContainer: {
    height: "calc(100% - 2.5rem)",
    backgroundColor: "#374151",
    borderRadius: "0.25rem",
    overflow: "hidden",
  },
  disconnectedMessage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#9ca3af",
    fontSize: "0.875rem",
  },
};

export default Navigation3DPlot;
