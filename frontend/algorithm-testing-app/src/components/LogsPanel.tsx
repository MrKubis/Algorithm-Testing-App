import React, { useRef, useEffect } from "react";
import { Log } from "./LogEntry";
import { LogEntry } from "./LogEntry";

interface LogsPanelProps {
  logs: Log[];
  onClear: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClear }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="card logs">
      <div className="logs-header">
        <h2>Test Logs</h2>
        <button
          onClick={onClear}
          className="button button-secondary button-small"
          disabled={logs.length === 0}
        >
          Clear
        </button>
      </div>
      <div className="logs-container">
        {logs.length === 0 ? (
          <p className="no-logs">No logs yet. Start a test to see logs here.</p>
        ) : (
          <>
            {logs.map((log, index) => <LogEntry key={index} log={log} />)}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
    </div>
  );
};
