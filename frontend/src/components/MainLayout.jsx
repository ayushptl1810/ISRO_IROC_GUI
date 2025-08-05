import React from "react";
import { LiveSensorReadings } from "./SensorReadings";
import UAVAlignment from "./UAVAlignmentPlot";
import LidarPlot from "./LidarPlot";
import DistanceSensorPlot from "./DistanceSensorPlot";
import FlightPathPlot from "./FlightPathPlot";
import Navigation3DPlot from "./Navigation3DPlot";

const MainLayout = () => {
  return (
    <div className="grid grid-cols-6 grid-rows-[auto,1fr] gap-4">
      {/* First row */}
      <div className="col-span-1">
        <UAVAlignment />
      </div>
      <div className="col-span-3">
        <LidarPlot />
      </div>
      <div className="col-span-2">
        <FlightPathPlot />
      </div>

      {/* Second row */}
      <div className="col-span-1">
        <LiveSensorReadings />
      </div>
      <div className="col-span-3">
        <DistanceSensorPlot />
      </div>
      <div className="col-span-2">
        <Navigation3DPlot />
      </div>
    </div>
  );
};

export default MainLayout;
