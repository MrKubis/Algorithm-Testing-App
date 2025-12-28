import React from "react";

interface TestControlsProps {
  isRunning: boolean;
  progress: number;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const TestControls: React.FC<TestControlsProps> = ({
  isRunning,
  progress,
  canStart,
  onStart,
  onStop,
}) => {
  return (
    <div className="card controls">
      <h2>Test Controls</h2>
      <div className="button-group">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="button button-primary"
            disabled={!canStart}
          >
            ▶ Start Test
          </button>
        ) : (
          <button onClick={onStop} className="button button-danger">
            ⏹ Stop Test
          </button>
        )}
      </div>

      {isRunning && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">{progress}% Complete</p>
        </div>
      )}
    </div>
  );
};
