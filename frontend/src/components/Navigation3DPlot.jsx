import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSensorData } from "../context/SensorContext";
import Plot from "react-plotly.js";

const Navigation3DPlot = () => {
  const { sensorData, connectionState } = useSensorData();
  const [plotData, setPlotData] = useState([]);
  const [lastPlotData, setLastPlotData] = useState([]); // Store last data for persistence
  const [persistentData, setPersistentData] = useState([]); // Data that persists when disconnected
  const plotRef = useRef(null);
  const [shouldUpdate, setShouldUpdate] = useState(true);

  // Memoize the plot data to prevent unnecessary re-renders
  const memoizedPlotData = useMemo(() => {
    if (!connectionState.isConnected) {
      return persistentData.length > 0 ? persistentData : plotData;
    }
    return plotData;
  }, [connectionState.isConnected, plotData, persistentData]);

  // Update plot data when 3D plot data is received from backend
  useEffect(() => {
    if (!connectionState.isConnected) {
      // When disconnected, stop updates but keep existing data
      setShouldUpdate(false);
      return;
    }

    // Enable updates when connected
    setShouldUpdate(true);

    // Only update data when connected and shouldUpdate is true
    if (!shouldUpdate) return;

    // Use accumulated data from backend
    const threeDData = sensorData?.threeDPlotData;
    if (!threeDData) return;

    const lidar0Data = threeDData.lidar_0 || [];
    const lidar1Data = threeDData.lidar_1 || [];

    if (lidar0Data.length === 0 && lidar1Data.length === 0) return;

    const traces = [
      {
        x: lidar0Data.map((d) => d.x),
        y: lidar0Data.map((d) => d.y),
        z: lidar0Data.map((d) => d.z),
        mode: "markers",
        type: "scatter3d",
        name: "Lidar ID=0",
        marker: {
          size: 8,
          color: "#ef4444",
          opacity: 0.8,
        },
        hovertemplate:
          "X: %{x:.2f}m<br>Y: %{y:.2f}m<br>Distance: %{z:.1f}cm<br>Sensor: Lidar ID=0<extra></extra>",
      },
      {
        x: lidar1Data.map((d) => d.x),
        y: lidar1Data.map((d) => d.y),
        z: lidar1Data.map((d) => d.z),
        mode: "markers",
        type: "scatter3d",
        name: "Lidar ID=1",
        marker: {
          size: 8,
          color: "#3b82f6",
          opacity: 0.8,
        },
        hovertemplate:
          "X: %{x:.2f}m<br>Y: %{y:.2f}m<br>Distance: %{z:.1f}cm<br>Sensor: Lidar ID=1<extra></extra>",
      },
    ];

    setPlotData(traces);
    setLastPlotData(traces); // Store for persistence
    setPersistentData(traces); // Store persistent data
  }, [connectionState.isConnected, sensorData?.threeDPlotData, shouldUpdate]);

  // Handle disconnect state - restore last data and prevent updates
  useEffect(() => {
    if (!connectionState.isConnected) {
      setShouldUpdate(false);
      // Don't update persistent data when disconnected
    } else {
      setShouldUpdate(true);
    }
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
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-base font-semibold text-green-400 mb-4 text-center">
        Navigation 3D Map
      </h2>
      <div className="h-[400px] relative">
        {memoizedPlotData.length > 0 ? (
          <Plot
            key="navigation-3d-plot"
            ref={plotRef}
            data={memoizedPlotData}
            layout={layout}
            config={{ displayModeBar: false }}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler={true}
            onInitialized={(figure) => {
              console.log("3D Plot initialized");
            }}
            onUpdate={(figure) => {
              console.log("3D Plot updated");
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Connect to view 3D Navigation Map
          </div>
        )}
      </div>
      <button
        onClick={async () => {
          // Clear local data
          setPlotData([]);
          setLastPlotData([]);
          setPersistentData([]);

          // Call backend reset endpoint
          try {
            await fetch("http://localhost:8000/reset_3d_plot");
            console.log("3D plot data reset on backend");
          } catch (error) {
            console.error("Failed to reset 3D plot data on backend:", error);
          }
        }}
        className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white rounded py-2 text-sm font-medium transition-colors"
      >
        Reset 3D Plot
      </button>
    </div>
  );
};

export default Navigation3DPlot;
