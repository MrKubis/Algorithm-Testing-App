import React from "react";
import "../css/CheckboxSelectors.css";

export interface Algorithm {
  id: string;
  name: string;
  description: string;
}

interface MultiAlgorithmSelectorProps {
  algorithms: Algorithm[];
  selectedAlgorithms: string[];
  onAlgorithmsChange: (algorithmIds: string[]) => void;
  disabled?: boolean;
}

export const MultiAlgorithmSelector: React.FC<MultiAlgorithmSelectorProps> = ({
  algorithms,
  selectedAlgorithms,
  onAlgorithmsChange,
  disabled = false,
}) => {
  const handleCheckboxChange = (algorithmId: string) => {
    if (selectedAlgorithms.includes(algorithmId)) {
      onAlgorithmsChange(selectedAlgorithms.filter(id => id !== algorithmId));
    } else {
      onAlgorithmsChange([...selectedAlgorithms, algorithmId]);
    }
  };

  const selectAll = () => {
    onAlgorithmsChange(algorithms.map(a => a.id));
  };

  const clearAll = () => {
    onAlgorithmsChange([]);
  };

  return (
    <div className="card">
      <h2>Algorithm Selection</h2>
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
          {selectedAlgorithms.length} selected
        </span>
      </div>
      
      <div className="checkbox-list">
        {algorithms.map((algo) => {
          const isSelected = selectedAlgorithms.includes(algo.id);
          return (
            <div key={algo.id} className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleCheckboxChange(algo.id)}
                  disabled={disabled}
                />
                <span className="checkbox-label">
                  <strong>{algo.name}</strong>
                  <span className="checkbox-description">{algo.description}</span>
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiAlgorithmSelector;
