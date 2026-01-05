import React from "react";

export interface TestResultData {
  algorithm: string;
  status: string;
  executionTime: string;
  operationsCount: number;
  memoryUsed: string;
  rawResult?: string | number;
}

interface TestResultsProps {
  results: TestResultData | any | null;
}

export const TestResults: React.FC<TestResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="card results">
      <h2>Test Results</h2>
      <div className="results-grid">
        <div className="result-item">
          <span className="result-label">Algorithm:</span>
          <span className="result-value">{results.algorithm || "Unknown"}</span>
        </div>

        <div className="result-item">
          <span className="result-label">Status:</span>
          <span className="result-value success">{results.status}</span>
        </div>

        <div className="result-item">
          <span className="result-label">Best Result:</span>
          <span className="result-value">{results.rawResult}</span>
        </div>

        <div className="result-item">
          <span className="result-label">Execution Time:</span>
          <span className="result-value">{results.executionTime}</span>
        </div>

        {results.operationsCount !== undefined && (
          <div className="result-item">
            <span className="result-label">Operations:</span>
            <span className="result-value">{results.operationsCount}</span>
          </div>
        )}

        {results.memoryUsed !== undefined && (
          <div className="result-item">
            <span className="result-label">Memory:</span>
            <span className="result-value">{results.memoryUsed} MB</span>
          </div>
        )}
      </div>
    </div>
  );
};
