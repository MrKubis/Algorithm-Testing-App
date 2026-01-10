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
    <div className="card results-card" style={{ marginTop: '20px' }}>
      <h2>Test Results</h2>
      <div className="results-grid">
        <div className="result-item">
          <label>Algorithm:</label>
          <span>{results.algorithm}</span>
        </div>
        <div className="result-item">
          <label>Status:</label>
          <span className={`status-${results.status.toLowerCase()}`}>
            {results.status}
          </span>
        </div>
      </div>
    </div>
  );
};