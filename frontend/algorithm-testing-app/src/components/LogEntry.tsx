import React from "react";

export interface Log {
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
}

interface LogEntryProps {
  log: Log;
}

export const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  return (
    <div className={`log-entry log-${log.type}`}>
      <span className="log-timestamp">{log.timestamp}</span>
      <span className="log-message">{log.message}</span>
    </div>
  );
};
