import React from "react";
import { AlgorithmMetadata, ParamInfo } from "../types";

interface AlgorithmSelectorProps {
  algorithms: AlgorithmMetadata[];
  selectedAlgorithm: string;
  parameterValues: { [key: string]: number };
  selectedFunction: string;
  onAlgorithmChange: (algoName: string) => void;
  onParameterChange: (name: string, value: number) => void;
  onFunctionChange: (funcName: string) => void;
  disabled?: boolean;
}

const AVAILABLE_FUNCTIONS = [
  "RastraginFunction",
  "RosenbrockFunction",
  "SphereFunction",
  "BealeFunction",
  "BukinFunction",
];

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  algorithms,
  selectedAlgorithm,
  parameterValues,
  selectedFunction,
  onAlgorithmChange,
  onParameterChange,
  onFunctionChange,
  disabled = false,
}) => {
  const currentAlgo = algorithms.find((a) => a.ClassName === selectedAlgorithm);

  return (
    <div className="card">
      <h2>Configuration</h2>
      <div className="form-group">
        <label htmlFor="algorithm-select">Select Algorithm</label>
        <select
          id="algorithm-select"
          className="algorithm-select"
          value={selectedAlgorithm}
          onChange={(e) => onAlgorithmChange(e.target.value)}
          disabled={disabled}
        >
          <option value="" disabled>
            -- Choose Algorithm --
          </option>
          {algorithms.map((algo) => (
            <option key={algo.ClassName} value={algo.ClassName}>
              {algo.DisplayName || algo.ClassName}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="function-select">Optimization Function</label>
        <select
          id="function-select"
          className="algorithm-select"
          value={selectedFunction}
          onChange={(e) => onFunctionChange(e.target.value)}
          disabled={disabled}
        >
          <option value="" disabled>
            -- Choose Function --
          </option>
          {AVAILABLE_FUNCTIONS.map((func) => (
            <option key={func} value={func}>
              {func}
            </option>
          ))}
        </select>
      </div>
      {currentAlgo && currentAlgo.ParamsInfo && (
        <div className="algorithm-info">
          <h3>Parameters</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            {currentAlgo.ParamsInfo.map((param: ParamInfo) => (
              <div key={param.Name}>
                <label
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  {param.Name}
                </label>
                <input
                  type="number"
                  className="algorithm-select"
                  style={{ width: "100%", padding: "8px" }}
                  disabled={disabled}
                  step="any"
                  min={param.LowerBoundary}
                  max={param.UpperBoundary}
                  value={
                    parameterValues[param.Name] ?? param.LowerBoundary ?? 0
                  }
                  onChange={(e) =>
                    onParameterChange(param.Name, parseFloat(e.target.value))
                  }
                />
                <small
                  style={{
                    color: "#555",
                    fontSize: "0.75rem",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  Range: {param.LowerBoundary} - {param.UpperBoundary}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
