import React from "react";

export interface TestResult {
  algorithm: string;
  status: string;
  executionTime: string;
  operationsCount: number;
  memoryUsed: string;
}

interface TestResultsProps {
  results: TestResult | null;
}

export const TestResults: React.FC<TestResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="card results">
      <h2>Test Results</h2>
      <div className="results-grid">
        <div className="result-item">
          <span className="result-label">Algorithm:</span>
          <span className="result-value">{results.algorithm}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Status:</span>
          <span className="result-value success">{results.status}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Execution Time:</span>
          <span className="result-value">{results.executionTime} ms</span>
        </div>
        <div className="result-item">
          <span className="result-label">Operations:</span>
          <span className="result-value">{results.operationsCount}</span>
        </div>
        <div className="result-item">
          <span className="result-label">Memory Used:</span>
          <span className="result-value">{results.memoryUsed} MB</span>
        </div>
      </div>
    </div>
  );
};
