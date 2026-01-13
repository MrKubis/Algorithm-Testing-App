import React from "react";
import { TestResults, TestResult } from "./TestResults";

export interface FunctionRunResultProps {
  functionName: string;
  status: "pending" | "running" | "completed" | "error";
  result?: TestResult;
  error?: string;
}

export const FunctionResultCard: React.FC<FunctionRunResultProps> = ({
  functionName,
  status,
  result,
  error,
}) => {
  const statusLabel = status === "completed" ? "Completed" : status === "running" ? "Running" : status === "error" ? "Error" : "Pending";

  return (
    <div className="card result-card">
      <div className="result-card__header">
        <h3>{functionName}</h3>
        <span className={`status-chip status-${status}`}>{statusLabel}</span>
      </div>
      {error && <p className="error-text">Error: {error}</p>}
      {result && <TestResults results={result} />}
    </div>
  );
};
