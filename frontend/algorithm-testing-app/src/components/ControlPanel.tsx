import React from "react";
import { AlgorithmSelector, Algorithm } from "./AlgorithmSelector";
import { TestControls } from "./TestControls";
import { TestResults, TestResult } from "./TestResults";

interface ControlPanelProps {
  algorithms: Algorithm[];
  selectedAlgorithm: string;
  isRunning: boolean;
  progress: number;
  testResults: TestResult | null;
  onAlgorithmChange: (algorithmId: string) => void;
  onStart: () => void;
  onStop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  algorithms,
  selectedAlgorithm,
  isRunning,
  progress,
  testResults,
  onAlgorithmChange,
  onStart,
  onStop,
}) => {
  return (
    <div className="control-panel">
      <AlgorithmSelector
        algorithms={algorithms}
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={onAlgorithmChange}
        disabled={isRunning}
      />

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
