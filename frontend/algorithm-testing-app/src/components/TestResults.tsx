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

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5046';

const downloadPDF = async (reportData: any, reportName: string) => {
  try {
    const response = await fetch(`${API_BASE}/api/algorithms/download-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    link.download = `${reportName}_${timestamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
};

export const TestResults: React.FC<TestResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="card results-card" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Test Results</h2>
        {results.rawData && (
          <button
            onClick={() => downloadPDF(results.rawData, results.algorithm)}
            className="button button-primary button-small button-inline"
          >
            📄 Download PDF
          </button>
        )}
      </div>
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
