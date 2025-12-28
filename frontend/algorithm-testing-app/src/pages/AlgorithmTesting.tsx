import React, { useState, useRef, useEffect } from "react";
import { Header } from "../components/Header";
import { AlgorithmSelector } from "../components/AlgorithmSelector";
import { ControlPanel } from "../components/ControlPanel";
import { LogsPanel } from "../components/LogsPanel";
import { Algorithm } from "../components/AlgorithmSelector";
import { TestResult } from "../components/TestResults";
import { Log } from "../components/LogEntry";
import "../css/AlgorithmTesting.css";

const AlgorithmTesting: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState<boolean>(true);
  const [algorithmError, setAlgorithmError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        const response = await fetch('http://localhost:5046/api/algorithms');
        if (!response.ok) {
          throw new Error('Failed to fetch algorithms');
        }
        const data = await response.json();
        setAlgorithms(data);
      } catch (error) {
        setAlgorithmError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoadingAlgorithms(false);
      }
    };

    fetchAlgorithms();
  }, []);

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

  if (loadingAlgorithms) {
    return (
      <div className="algorithm-testing-container">
        <Header />
        <div className="loading">Loading algorithms...</div>
      </div>
    );
  }

  if (algorithmError) {
    return (
      <div className="algorithm-testing-container">
        <Header />
        <div className="error">Error loading algorithms: {algorithmError}</div>
      </div>
    );
  }

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
