import React from "react";
import { Algorithm } from "./AlgorithmSelector";
import { TestControls } from "./TestControls";

interface ControlPanelProps {
  algorithms: Algorithm[];
  selectedAlgorithm: string;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  algorithms,
  selectedAlgorithm,
  isRunning,
  isPaused,
  progress,
  onStart,
  onStop,
  onPause,
  onResume,
}) => {
  return (
    <div className="control-panel">
      <TestControls
        isRunning={isRunning}
        isPaused={isPaused}
        progress={progress}
        canStart={!!selectedAlgorithm}
        onStart={onStart}
        onStop={onStop}
        onPause={onPause}
        onResume={onResume}
      />
    </div>
  );
};