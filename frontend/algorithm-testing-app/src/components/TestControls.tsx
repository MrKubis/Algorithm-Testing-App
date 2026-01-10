import React from "react";

interface TestControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const TestControls: React.FC<TestControlsProps> = ({
  isRunning,
  isPaused,
  progress,
  canStart,
  onStart,
  onStop,
  onPause,
  onResume,
}) => {
  return (
    <div className="card controls">
      <h2>Test Controls</h2>
      <div className="button-group" style={{ display: 'flex', gap: '10px' }}>
        {!isRunning ? (
          <button
            onClick={onStart}
            className="button button-primary"
            disabled={!canStart}
          >
            ▶ Start Test
          </button>
        ) : (
          <>
            {/* PAUSE / RESUME BUTTON */}
            <button 
              onClick={isPaused ? onResume : onPause} 
              className="button"
              style={{ backgroundColor: isPaused ? '#4CAF50' : '#FF9800', color: 'white' }}
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>

            <button onClick={onStop} className="button button-danger">
              ⏹ Stop Test
            </button>
          </>
        )}
      </div>

      {(isRunning || isPaused) && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ 
                width: `${progress}%`,
                backgroundColor: isPaused ? '#ccc' : undefined
              }} 
            ></div>
          </div>
          <p className="progress-text">
            {progress}% Complete {isPaused && "(Paused)"}
          </p>
        </div>
      )}
    </div>
  );
};