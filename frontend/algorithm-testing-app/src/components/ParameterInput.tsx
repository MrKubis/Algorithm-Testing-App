import React, { useState, useEffect } from "react";
import { AlgorithmParam } from "../services/AlgorithmService";

interface ParameterInputProps {
  params: AlgorithmParam[];
  onParamChange: (params: Record<string, number>) => void;
  disabled?: boolean;
  defaultOverrides?: Record<string, number>;
  disabledParams?: string[];
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  params,
  onParamChange,
  disabled = false,
  defaultOverrides = {},
  disabledParams = [],
}) => {
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize parameter values only once on mount
  useEffect(() => {
    if (!isInitialized && params.length > 0) {
      const initialValues: Record<string, number> = {};
      params.forEach((param) => {
        // Use defaultOverrides if provided, otherwise use param defaults
        if (defaultOverrides.hasOwnProperty(param.name)) {
          initialValues[param.name] = defaultOverrides[param.name];
        } else {
          initialValues[param.name] = param.defaultValue || (param.lowerBoundary ?? 1);
        }
      });
      setParamValues(initialValues);
      onParamChange(initialValues);
      setIsInitialized(true);
    }
  }, [isInitialized, params.length]);

  // Update values when defaultOverrides change (e.g., function switch)
  useEffect(() => {
    if (isInitialized && Object.keys(defaultOverrides).length > 0) {
      setParamValues(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        Object.entries(defaultOverrides).forEach(([key, value]) => {
          if (prev[key] !== value) {
            updated[key] = value;
            hasChanges = true;
          }
        });
        if (hasChanges) {
          onParamChange(updated);
        }
        return updated;
      });
    }
  }, [defaultOverrides, isInitialized]);

  const handleParamChange = (paramName: string, value: string) => {
    const numValue = parseFloat(value);
    const newValues = { ...paramValues, [paramName]: numValue };
    setParamValues(newValues);
    onParamChange(newValues);
  };

  return (
    <div className="card">
      <h2>Algorithm Parameters</h2>
      {params.length === 0 ? (
        <p>No parameters available for this algorithm.</p>
      ) : (
        <div className="parameters-grid">
          {params.map((param) => (
            <div key={param.name} className="parameter-group">
              <label htmlFor={`param-${param.name}`}>
                {param.name}
                <span className="param-description">{param.description}</span>
                {disabledParams.includes(param.name) && (
                  <span style={{ color: '#FF6B6B', marginLeft: '5px', fontSize: '0.8em' }}>(auto-set)</span>
                )}
              </label>
              <div className="parameter-input-wrapper">
                <input
                  id={`param-${param.name}`}
                  type="number"
                  min={param.lowerBoundary ?? undefined}
                  max={param.upperBoundary ?? undefined}
                  step="0.1"
                  value={paramValues[param.name] || ""}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  disabled={disabled || disabledParams.includes(param.name)}
                  className="parameter-input"
                />
                <div className="parameter-bounds">
                  Min: {param.lowerBoundary ?? "unlimited"} | Max: {param.upperBoundary ?? "unlimited"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParameterInput;
