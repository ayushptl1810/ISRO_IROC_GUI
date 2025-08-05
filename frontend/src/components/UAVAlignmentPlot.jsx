import React from "react";
import { useSensorData } from "../context/SensorContext";

const UAVAlignment = () => {
  const { sensorData } = useSensorData();

  // Tolerance values in degrees
  const ROLL_TOLERANCE = 5; // Roll is unstable beyond ±5 degrees
  const PITCH_TOLERANCE = 5; // Pitch is unstable beyond ±5 degrees

  // Get gyroscope data, defaulting to 0 if not available
  const gyroX = parseFloat(sensorData?.I?.G?.xgyro || 0);
  const gyroY = parseFloat(sensorData?.I?.G?.ygyro || 0);
  const gyroZ = parseFloat(sensorData?.I?.G?.zgyro || 0);

  // Calculate rotation angles (simplified)
  // Note: In a real application, you'd want to use proper quaternion or euler angle calculations
  const pitch = Math.min(Math.max(gyroY * 2, -45), 45); // Limit to ±45 degrees
  const roll = Math.min(Math.max(gyroX * 2, -45), 45); // Limit to ±45 degrees

  // Determine stability status
  const isRollStable = Math.abs(roll) <= ROLL_TOLERANCE;
  const isPitchStable = Math.abs(pitch) <= PITCH_TOLERANCE;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>UAV Alignment</h2>
      <div style={styles.content}>
        {/* UAV Orientation Visualization */}
        <div style={styles.graphContainer}>
          {/* Horizon Line */}
          <div
            style={{
              ...styles.horizonLine,
              transform: `translateY(-50%) rotate(${roll}deg)`,
            }}
          />

          {/* Pitch Indicator */}
          <div
            style={{
              ...styles.pitchLine,
              transform: `translateX(-50%) rotate(${pitch}deg)`,
            }}
          />

          {/* Center Point */}
          <div style={styles.centerPoint} />

          {/* Degree Markers */}
          <div style={styles.degreeMarkers}>
            <div style={styles.degreeCircle} />
            <div style={{ ...styles.degreeCircle, transform: "scale(0.75)" }} />
            <div style={{ ...styles.degreeCircle, transform: "scale(0.5)" }} />
          </div>
        </div>

        {/* Numerical Values */}
        <div style={styles.valuesContainer}>
          <div style={styles.valueItem}>
            <div style={styles.valueLabel}>Roll</div>
            <div style={styles.valueText}>{roll.toFixed(1)}°</div>
          </div>
          <div style={styles.valueItem}>
            <div style={styles.valueLabel}>Pitch</div>
            <div style={styles.valueText}>{pitch.toFixed(1)}°</div>
          </div>
          <div style={styles.valueItem}>
            <div style={styles.valueLabel}>Yaw</div>
            <div style={styles.valueText}>{gyroZ.toFixed(1)}°/s</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={styles.statusContainer}>
          <div
            style={{
              ...styles.statusButton,
              backgroundColor: isRollStable ? "#059669" : "#dc2626",
            }}
          >
            Roll {isRollStable ? "Stable" : "Unstable"}
          </div>
          <div
            style={{
              ...styles.statusButton,
              backgroundColor: isPitchStable ? "#059669" : "#dc2626",
            }}
          >
            Pitch {isPitchStable ? "Stable" : "Unstable"}
          </div>
        </div>

        {/* Tolerance Info */}
        <div style={styles.toleranceText}>Tolerance: ±{ROLL_TOLERANCE}°</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#1f2937",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    border: "1px solid #374151",
    color: "#ffffff",
  },
  title: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#4ade80",
    marginBottom: "1rem",
    textAlign: "center",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  graphContainer: {
    position: "relative",
    width: "12rem",
    height: "12rem",
    backgroundColor: "#374151",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    marginBottom: "1rem",
  },
  horizonLine: {
    position: "absolute",
    width: "100%",
    height: "2px",
    backgroundColor: "#3b82f6",
    top: "50%",
    transformOrigin: "center",
  },
  pitchLine: {
    position: "absolute",
    width: "2px",
    height: "100%",
    backgroundColor: "#ef4444",
    left: "50%",
    transformOrigin: "center",
  },
  centerPoint: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "8px",
    height: "8px",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
  },
  degreeMarkers: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  degreeCircle: {
    position: "absolute",
    width: "100%",
    height: "100%",
    border: "1px solid #4b5563",
    borderRadius: "50%",
  },
  valuesContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    textAlign: "center",
    marginBottom: "1rem",
  },
  valueItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  valueLabel: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    marginBottom: "0.25rem",
  },
  valueText: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  statusContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    marginBottom: "0.5rem",
  },
  statusButton: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.25rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
    textAlign: "center",
  },
  toleranceText: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    textAlign: "center",
  },
};

export default UAVAlignment;
