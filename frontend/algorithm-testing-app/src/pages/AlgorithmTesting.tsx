import React, { useState, useRef } from "react";
import { Header } from "../components/Header";
import { AlgorithmSelector } from "../components/AlgorithmSelector";
import { ControlPanel } from "../components/ControlPanel";
import { LogsPanel } from "../components/LogsPanel";
import { Algorithm } from "../components/AlgorithmSelector";
import { TestResult } from "../components/TestResults";
import { Log } from "../components/LogEntry";
import "../css/AlgorithmTesting.css";

const AlgorithmTesting: React.FC = () => {
  const algorithms: Algorithm[] = [
    {
      id: "bubble_sort",
      name: "Bubble Sort",
      description: "Simple sorting algorithm",
    },
    {
      id: "quick_sort",
      name: "Quick Sort",
      description: "Fast divide-and-conquer sorting",
    },
    {
      id: "merge_sort",
      name: "Merge Sort",
      description: "Stable divide-and-conquer sorting",
    },
    {
      id: "linear_search",
      name: "Linear Search",
      description: "Sequential search algorithm",
    },
    {
      id: "binary_search",
      name: "Binary Search",
      description: "Logarithmic search algorithm",
    },
  ];

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (message: string, type: Log["type"] = "info"): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const startTest = async (): Promise<void> => {
    if (!selectedAlgorithm) {
      addLog("Please select an algorithm first", "error");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setTestResults(null);
    abortControllerRef.current = new AbortController();

    const algorithmName = algorithms.find(
      (a) => a.id === selectedAlgorithm
    )?.name;
    addLog(`Starting test for ${algorithmName}...`, "info");

    try {
      // Simulate test execution with progress updates
      for (let i = 0; i <= 100; i += 10) {
        if (abortControllerRef.current?.signal.aborted) {
          addLog("Test stopped by user", "warning");
          break;
        }

        setProgress(i);
        addLog(`Processing... ${i}%`, "info");

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!abortControllerRef.current?.signal.aborted) {
        setProgress(100);
        const results: TestResult = {
          algorithm: algorithmName || "Unknown",
          status: "Completed",
          executionTime: (Math.random() * 1000 + 100).toFixed(2),
          operationsCount: Math.floor(Math.random() * 10000 + 1000),
          memoryUsed: (Math.random() * 50 + 10).toFixed(2),
        };
        setTestResults(results);
        addLog("Test completed successfully!", "success");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`, "error");
    } finally {
      setIsRunning(false);
    }
  };

  const stopTest = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    addLog("Test stopped", "warning");
  };

  const clearLogs = (): void => {
    setLogs([]);
  };

  return (
    <div className="algorithm-testing-container">
      <Header />

      <div className="testing-layout">
        <ControlPanel
          algorithms={algorithms}
          selectedAlgorithm={selectedAlgorithm}
          isRunning={isRunning}
          progress={progress}
          testResults={testResults}
          onAlgorithmChange={setSelectedAlgorithm}
          onStart={startTest}
          onStop={stopTest}
        />

        <div className="log-panel">
          <LogsPanel logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTesting;
