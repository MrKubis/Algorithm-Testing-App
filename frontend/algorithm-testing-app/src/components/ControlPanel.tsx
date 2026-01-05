import React from "react";
import { AlgorithmSelector } from "./AlgorithmSelector";
import { TestControls } from "./TestControls";
import { TestResults } from "./TestResults";
import { AlgorithmMetadata } from "../types";

interface ControlPanelProps {
  algorithms: AlgorithmMetadata[];
  selectedAlgorithm: string;
  parameterValues: { [key: string]: number };
  selectedFunction: string;
  isRunning: boolean;
  progress: number;
  testResults: any;

  onAlgorithmChange: (id: string) => void;
  onParameterChange: (name: string, val: number) => void;
  onFunctionChange: (name: string) => void;
  onStart: () => void;
  onStop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  return (
    <div className="control-panel">
      <AlgorithmSelector
        algorithms={props.algorithms}
        selectedAlgorithm={props.selectedAlgorithm}
        parameterValues={props.parameterValues}
        selectedFunction={props.selectedFunction}
        onAlgorithmChange={props.onAlgorithmChange}
        onParameterChange={props.onParameterChange}
        onFunctionChange={props.onFunctionChange}
        disabled={props.isRunning}
      />

      <TestControls
        isRunning={props.isRunning}
        progress={props.progress}
        canStart={!!props.selectedAlgorithm}
        onStart={props.onStart}
        onStop={props.onStop}
      />

      <TestResults results={props.testResults} />
    </div>
  );
};
