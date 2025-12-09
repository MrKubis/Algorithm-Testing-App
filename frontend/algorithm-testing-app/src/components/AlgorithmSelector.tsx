import React from "react";

export interface Algorithm {
  id: string;
  name: string;
  description: string;
}

interface AlgorithmSelectorProps {
  algorithms: Algorithm[];
  selectedAlgorithm: string;
  onAlgorithmChange: (algorithmId: string) => void;
  disabled?: boolean;
}

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  algorithms,
  selectedAlgorithm,
  onAlgorithmChange,
  disabled = false,
}) => {
  const selected = algorithms.find((a) => a.id === selectedAlgorithm);

  return (
    <div className="card">
      <h2>Algorithm Selection</h2>
      <div className="form-group">
        <label htmlFor="algorithm-select">Select Algorithm:</label>
        <select
          id="algorithm-select"
          value={selectedAlgorithm}
          onChange={(e) => onAlgorithmChange(e.target.value)}
          disabled={disabled}
          className="algorithm-select"
        >
          <option value="">-- Choose an algorithm --</option>
          {algorithms.map((algo) => (
            <option key={algo.id} value={algo.id}>
              {algo.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="algorithm-info">
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
        </div>
      )}
    </div>
  );
};
