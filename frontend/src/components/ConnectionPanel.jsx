import React, { useState } from "react";
import { useSensorData } from "../context/SensorContext";

export const ConnectionPanel = () => {
  const { connectionState, connect, disconnect, resetData } = useSensorData();
  const [selectedPort, setSelectedPort] = useState(connectionState.port);
  const [baudRate, setBaudRate] = useState(connectionState.baudRate);

  const handleConnect = () => {
    if (connectionState.isConnected) {
      disconnect();
    } else {
      connect(selectedPort, baudRate);
    }
  };

  const handleReset = () => {
    resetData();
  };

  return (
    <div className="mb-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Port</label>
                <input
                  type="text"
                  value={selectedPort}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  disabled={connectionState.isConnected}
                  placeholder="/dev/tty.usbserial-0001"
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border-0 focus:ring-2 focus:ring-green-500 focus:outline-none w-64"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Baud Rate</label>
                <input
                  type="text"
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  disabled={connectionState.isConnected}
                  placeholder="115200"
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm border-0 focus:ring-2 focus:ring-green-500 focus:outline-none w-32"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleConnect}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                connectionState.isConnected
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {connectionState.isConnected ? "Disconnect" : "Connect"}
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reset Data
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionState.isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-400">
              {connectionState.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {connectionState.isConnected && (
            <div className="text-xs text-gray-400">
              Port: {connectionState.port} | Baud: {connectionState.baudRate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
