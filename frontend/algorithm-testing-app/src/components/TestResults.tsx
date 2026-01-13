import React from "react";

export interface TestResult {
  algorithm: string;
  status: string;
  executionTime?: string;
  operationsCount?: number;
  memoryUsed?: string;
  stepsCount?: number;
  evaluations?: Array<{
    Function: string;
    FBest: number;
    XBest: { Values: number[] };
    XFinal: Array<{ Values: number[] }>;
    Step: number;
    minValue: number;
    maxValue: number;
  }>;
  paramValues?: Record<string, any>;
  rawData?: any;
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
        {results.stepsCount && (
          <div className="result-item">
            <label>Steps Completed:</label>
            <span>{results.stepsCount}</span>
          </div>
        )}
        {results.executionTime && (
          <div className="result-item">
            <label>Execution Time:</label>
            <span>{results.executionTime}</span>
          </div>
        )}
      </div>

      {results.evaluations && results.evaluations.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Evaluation Results</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Function</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Step</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Best Fitness</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Best Solution</th>
                </tr>
              </thead>
              <tbody>
                {results.evaluations.map((evaluation, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{evaluation.Function || "N/A"}</td>
                    <td style={{ padding: '8px' }}>{evaluation.Step || "N/A"}</td>
                    <td style={{ padding: '8px' }}>{evaluation.FBest != null ? evaluation.FBest.toFixed(6) : "N/A"}</td>
                    <td style={{ padding: '8px', fontSize: '0.9em' }}>
                      {evaluation.XBest?.Values ? `[${evaluation.XBest.Values.map(v => v.toFixed(4)).join(", ")}]` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.paramValues && (
        <div style={{ marginTop: '20px' }}>
          <h3>Algorithm Parameters Used</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            {Object.entries(results.paramValues).map(([key, value]) => (
              <div key={key} style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}>
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;
