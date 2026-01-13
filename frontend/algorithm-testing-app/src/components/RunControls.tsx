import React from "react";
import { FunctionSelector } from "./FunctionSelector";

interface RunControlsProps {
  selectedFunction: string;
  isRunning: boolean;
  isPaused: boolean;
  onFunctionChange: (value: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const RunControls: React.FC<RunControlsProps> = ({
  selectedFunction,
  isRunning,
  isPaused,
  onFunctionChange,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  return (
    <>
      <FunctionSelector
        selectedFunction={selectedFunction}
        onFunctionChange={onFunctionChange}
        disabled={isRunning}
      />
      <div className="button-group full-width">
        <button
          className="button button-primary run-button-fixed"
          onClick={() => {
            if (isPaused) {
              onResume();
            } else if (isRunning) {
              onPause();
            } else {
              onStart();
            }
          }}
          disabled={!selectedFunction}
          style={{ flex: 1 }}
        >
          {isPaused ? "▶ Resume" : isRunning ? "⏸ Pause" : "▶ Run Across Algorithms"}
        </button>
        {(isRunning || isPaused) && (
          <button
            className="button button-danger run-button-fixed"
            onClick={onStop}
            style={{ flex: 0.3 }}
          >
            ⏹ Stop
          </button>
        )}
      </div>
    </>
  );
};
