import React, { useRef, useEffect } from "react";
import { Log } from "./LogEntry";
import { LogEntry } from "./LogEntry";

interface LogsPanelProps {
  logs: Log[];
  onClear: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClear }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      
      containerRef.current.scrollTop = scrollHeight - clientHeight;
      
    }
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
      
      <div className="logs-container" ref={containerRef}>
        {logs.length === 0 ? (
          <p className="no-logs">No logs yet. Start a test to see logs here.</p>
        ) : (
          <>
            {logs.map((log, index) => <LogEntry key={index} log={log} />)}
          </>
        )}
      </div>
    </div>
  );
};