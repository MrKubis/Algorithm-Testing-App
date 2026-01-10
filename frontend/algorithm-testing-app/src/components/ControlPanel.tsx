import React from "react";
import { Algorithm } from "./AlgorithmSelector";
import { TestControls } from "./TestControls";
import { TestResults, TestResult } from "./TestResults";

interface ControlPanelProps {
  algorithms: Algorithm[];
  selectedAlgorithm: string;
  isRunning: boolean;
  progress: number;
  testResults: TestResult | null;
  onStart: () => void;
  onStop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  algorithms,
  selectedAlgorithm,
  isRunning,
  progress,
  testResults,
  onStart,
  onStop,
}) => {
  return (
    <div className="control-panel">
      <TestControls
        isRunning={isRunning}
        progress={progress}
        canStart={!!selectedAlgorithm}
        onStart={onStart}
        onStop={onStop}
      />

      <TestResults results={testResults} />
    </div>
  );
};
