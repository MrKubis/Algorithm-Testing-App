import React from "react";
import "../css/CheckboxSelectors.css";

export interface TestFunction {
  id: string;
  name: string;
  description: string;
  minValue: number;
  maxValue: number;
  yMinValue?: number;
  yMaxValue?: number;
}

interface MultiFunctionSelectorProps {
  selectedFunctions: string[];
  onFunctionsChange: (functionIds: string[]) => void;
  disabled?: boolean;
}

export const MultiFunctionSelector: React.FC<MultiFunctionSelectorProps> = ({
  selectedFunctions,
  onFunctionsChange,
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

  const handleCheckboxChange = (functionId: string) => {
    if (selectedFunctions.includes(functionId)) {
      onFunctionsChange(selectedFunctions.filter(id => id !== functionId));
    } else {
      onFunctionsChange([...selectedFunctions, functionId]);
    }
  };

  const selectAll = () => {
    onFunctionsChange(functions.map(f => f.id));
  };

  const clearAll = () => {
    onFunctionsChange([]);
  };

  return (
    <div className="card">
      <h2>Test Functions</h2>
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button 
          onClick={selectAll} 
          disabled={disabled}
          className="button button-small"
          style={{ fontSize: "0.85rem", padding: "4px 8px" }}
        >
          Select All
        </button>
        <button 
          onClick={clearAll} 
          disabled={disabled}
          className="button button-small"
          style={{ fontSize: "0.85rem", padding: "4px 8px" }}
        >
          Clear All
        </button>
        <span style={{ marginLeft: "auto", fontSize: "0.9rem", color: "#666" }}>
          {selectedFunctions.length} selected
        </span>
      </div>
      
      <div className="checkbox-list">
        {functions.map((func) => {
          const isSelected = selectedFunctions.includes(func.id);
          return (
            <div key={func.id} className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleCheckboxChange(func.id)}
                  disabled={disabled}
                />
                <span className="checkbox-label">
                  <strong>{func.name}</strong>
                  <span className="checkbox-description">{func.description}</span>
                  <span className="checkbox-domain">
                    Domain X: [{func.minValue}, {func.maxValue}]
                    {func.yMinValue !== undefined && func.yMaxValue !== undefined && (
                      <>, Y: [{func.yMinValue}, {func.yMaxValue}]</>
                    )}
                  </span>
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiFunctionSelector;
