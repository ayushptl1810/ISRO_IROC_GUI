import React from "react";

const Plot = ({ title }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-2 text-center text-white">{title}</h2>
      <div className="bg-gray-700 h-64 rounded-md"></div>
    </div>
  );
};

export default Plot;
