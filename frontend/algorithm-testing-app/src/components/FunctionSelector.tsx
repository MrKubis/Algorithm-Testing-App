import React from "react";

export interface TestFunction {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  yMinValue?: number;
  yMaxValue?: number;
}

interface FunctionSelectorProps {
  selectedFunction: string;
  onFunctionChange: (functionId: string) => void;
  disabled?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  selectedFunction,
  onFunctionChange,
  disabled = false,
}) => {
  const functions: TestFunction[] = [
    {
      id: "Sphere",
      name: "Sphere Function",
      description: "Simple convex function: f(x) = Σ(xi²)",
      minValue: -5.0,
      maxValue: 5.0,
    },
    {
      id: "Rastragin",
      name: "Rastragin Function",
      description: "Highly multimodal function with many local minima",
      minValue: -5.12,
      maxValue: 5.12,
    },
    {
      id: "Rosenbrock",
      name: "Rosenbrock Function",
      description: "Valley-shaped function, difficult for optimization",
      minValue: -2.048,
      maxValue: 2.048,
    },
    {
      id: "Beale",
      name: "Beale Function",
      description: "2-dimensional function with steep ridges",
      minValue: -4.5,
      maxValue: 4.5,
      yMinValue: -4.5,
      yMaxValue: 4.5,
    },
    {
      id: "Bukin",
      name: "Bukin Function",
      description: "2-dimensional function with a narrow valley",
      minValue: -15.0,
      maxValue: -5.0,
      yMinValue: -3.0,
      yMaxValue: 3.0,
    },
  ];

  const selected = functions.find((f) => f.id === selectedFunction);

  return (
    <div className="card">
      <h2>Test Function</h2>
      <div className="form-group">
        <label htmlFor="function-select">Select Test Function:</label>
        <select
          id="function-select"
          value={selectedFunction}
          onChange={(e) => onFunctionChange(e.target.value)}
          disabled={disabled}
          className="algorithm-select"
        >
          <option value="">-- Choose a function --</option>
          {functions.map((func) => (
            <option key={func.id} value={func.id}>
              {func.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="algorithm-info">
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            <strong>Domain X:</strong> [{selected.minValue}, {selected.maxValue}]
            {selected.yMinValue !== undefined && selected.yMaxValue !== undefined && (
              <><br /><strong>Domain Y:</strong> [{selected.yMinValue}, {selected.yMaxValue}]</>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default FunctionSelector;
