import React from "react";
import { LiveSensorReadings } from "./SensorReadings";
import UAVAlignment from "./UAVAlignmentPlot";
import LidarPlot from "./LidarPlot";
import DistanceSensorPlot from "./DistanceSensorPlot";
import FlightPathPlot from "./FlightPathPlot";
import Navigation3DPlot from "./Navigation3DPlot";

const MainLayout = () => {
  return (
    <div className="grid grid-cols-6 gap-4">
      <div className="col-span-1 flex flex-col gap-4">
        <UAVAlignment />
        <LiveSensorReadings />
      </div>
      <div className="col-span-3 grid grid-rows-2 gap-4">
        <LidarPlot />
        <DistanceSensorPlot />
      </div>
      <div className="col-span-2 grid grid-rows-2 gap-4">
        <FlightPathPlot />
        <Navigation3DPlot />
      </div>
    </div>
  );
};

export default MainLayout;
