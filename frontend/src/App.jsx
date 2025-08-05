import React from "react";
import "./App.css";
import MainLayout from "./components/MainLayout";
import { SensorProvider } from "./context/SensorContext";
import { ConnectionPanel } from "./components/ConnectionPanel";

function App() {
  return (
    <SensorProvider>
      <div className="min-h-screen bg-black text-white p-4">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-green-500 text-center">
            UAV Ground Station Control System
          </h1>
          <p className="text-gray-400 mt-1 text-sm text-center">
            Real-time sensor monitoring and visualization
          </p>
        </header>
        <main>
          <ConnectionPanel />
          <MainLayout />
        </main>
      </div>
    </SensorProvider>
  );
}

export default App;
