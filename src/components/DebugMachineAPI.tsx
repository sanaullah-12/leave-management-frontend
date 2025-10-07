// Debug component to test API calls
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { realMachinePerformanceAPI } from "../services/api";

const DebugMachineAPI: React.FC<{ machineIP: string }> = ({ machineIP }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["debug-real-machine", machineIP],
    queryFn: () => {
      console.log(
        "🔍 DEBUG: Calling realMachinePerformanceAPI.getMachineUsersPerformance"
      );
      console.log("🔍 DEBUG: machineIP:", machineIP);
      return realMachinePerformanceAPI.getMachineUsersPerformance(machineIP, {
        startDate: "2025-09-01",
        endDate: "2025-10-02",
        limit: 5,
      });
    },
    enabled: !!machineIP,
  });

  return (
    <div className="bg-yellow-100 p-4 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800">🐛 DEBUG: Real Machine API</h3>
      <p>Machine IP: {machineIP}</p>
      <p>Loading: {isLoading ? "YES" : "NO"}</p>
      <p>
        Error:{" "}
        {error
          ? JSON.stringify((error as any).response?.data || error.message)
          : "None"}
      </p>
      <p>
        Data:{" "}
        {data ? `${data.data?.leaderboard?.length || 0} employees` : "None"}
      </p>
      {data && (
        <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs mt-2 overflow-auto">
          {JSON.stringify(data.data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default DebugMachineAPI;
