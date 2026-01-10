import React, { useState, useRef, useEffect } from "react";
import { Header } from "../components/Header";
import { AlgorithmSelector, Algorithm } from "../components/AlgorithmSelector";
import { FunctionSelector } from "../components/FunctionSelector";
import { ParameterInput } from "../components/ParameterInput";
import { ControlPanel } from "../components/ControlPanel";
import { LogsPanel } from "../components/LogsPanel";
import { TestResult } from "../components/TestResults";
import { Log } from "../components/LogEntry";
import AlgorithmService, { AlgorithmParam } from "../services/AlgorithmService";
import AlgorithmWebSocketService from "../services/AlgorithmWebSocketService";
import "../css/AlgorithmTesting.css";

const AlgorithmTesting: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [loadingAlgorithms, setLoadingAlgorithms] = useState<boolean>(true);
  const [algorithmError, setAlgorithmError] = useState<string | null>(null);
  const [algorithmParams, setAlgorithmParams] = useState<AlgorithmParam[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [selectedFunction, setSelectedFunction] = useState<string>("Sphere");
  const wsServiceRef = useRef<AlgorithmWebSocketService | null>(null);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        console.log('Fetching algorithms from backend...');
        const data = await AlgorithmService.getAlgorithms();
        console.log('Algorithms fetched:', data);
        setAlgorithms(data);
      } catch (error) {
        console.error('Error:', error);
        setAlgorithmError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoadingAlgorithms(false);
      }
    };

    fetchAlgorithms();

    // Initialize WebSocket service
    wsServiceRef.current = new AlgorithmWebSocketService();

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, []);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load algorithm parameters when selected algorithm changes
  useEffect(() => {
    const loadAlgorithmDetails = async () => {
      if (!selectedAlgorithm) {
        setAlgorithmParams([]);
        return;
      }

      try {
        const details = await AlgorithmService.getAlgorithmDetails(selectedAlgorithm);
        setAlgorithmParams(details.params);
        addLog(`Loaded parameters for ${selectedAlgorithm}`, "info");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        addLog(`Failed to load algorithm parameters: ${errorMsg}`, "error");
      }
    };

    loadAlgorithmDetails();
  }, [selectedAlgorithm]);

  const addLog = (message: string, type: Log["type"] = "info"): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const startTest = async (): Promise<void> => {
    if (!selectedAlgorithm) {
      addLog("Please select an algorithm first", "error");
      return;
    }

    // Validate parameters
    const paramErrors = AlgorithmService.validateParams(paramValues, algorithmParams);
    if (paramErrors.length > 0) {
      paramErrors.forEach(error => addLog(error, "error"));
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
      // Connect WebSocket if not already connected
      if (wsServiceRef.current && !wsServiceRef.current.isConnected()) {
        await wsServiceRef.current.connect((message: any) => {
          console.log("Message from WebSocket:", message, "Type:", typeof message);
          
          // Handle completion string
          if (typeof message === "string") {
            if (message === "done") {
              addLog("Algorithm execution completed", "success");
              return;
            }
            
            // Try to parse as JSON (final report)
            try {
              const report = JSON.parse(message);
              if (report.algorithmReport || report.functionReport) {
                console.log("Received final report:", report);
                setTestResults({
                  algorithm: algorithmName || "Unknown",
                  status: "Completed",
                  executionTime: "0",
                  operationsCount: 0,
                  memoryUsed: "0"
                });
                setProgress(100);
                addLog("Test completed successfully!", "success");
              }
            } catch (e) {
              // Not JSON, just a status message
              console.log("String message:", message);
              addLog(message, "info");
            }
            return;
          }

          // Handle object messages
          if (typeof message === "object" && message !== null) {
            console.log("Object message with keys:", Object.keys(message));
            
            // Handle log messages from backend
            if (message.type === "log") {
              console.log("Adding log:", message.message);
              addLog(message.message, "info");
              return;
            }
            
            if (message.error) {
              addLog(`Error: ${message.error}`, "error");
            }
            if (message.status) {
              addLog(message.status, "info");
            }
            if (message.progress) {
              setProgress(message.progress);
            }
          }
        });
      }

      // Send algorithm request
      const steps = 100;
      
      // Get function bounds based on selected function
      let minValue = -5.0;
      let maxValue = 5.0;
      
      if (selectedFunction === "Rastragin") {
        minValue = -5.12;
        maxValue = 5.12;
      } else if (selectedFunction === "Rosenbrock") {
        minValue = -2.048;
        maxValue = 2.048;
      } else if (selectedFunction === "Beale") {
        minValue = -4.5;
        maxValue = 4.5;
      } else if (selectedFunction === "Bukin") {
        minValue = -15.0;
        maxValue = -5.0;
      }

      const request = {
        Type: "Algorithm",
        Body: {
          AlgorithmName: selectedAlgorithm,
          ParamValues: paramValues,
          Steps: steps,
          FunctionList: [
            {
              FunctionName: selectedFunction,
              minValue: minValue,
              maxValue: maxValue
            }
          ]
        }
      };

      addLog("Sending algorithm request to backend...", "info");
      if (wsServiceRef.current) {
        wsServiceRef.current.sendRequest(request);
        addLog("Algorithm request sent", "info");

        // Wait a moment for the request to be processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Send START command
        addLog("Sending START command to backend...", "info");
        wsServiceRef.current.sendCommand("START");
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
    if (wsServiceRef.current && wsServiceRef.current.isConnected()) {
      wsServiceRef.current.sendCommand("STOP");
      addLog("Sent STOP command to backend", "info");
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    addLog("Test stopped by user", "warning");
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
        <div className="error" style={{ padding: '20px' }}>
          <h2>Error loading algorithms</h2>
          <p>{algorithmError}</p>
          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
            <strong>Troubleshooting:</strong><br/>
            1. Make sure the backend is running on <code>http://localhost:5046</code><br/>
            2. Run: <code>dotnet run</code> from <code>backend/AlgorithmTester.API/AlgorithmTester.API/</code><br/>
            3. Check browser console (F12) for more details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="algorithm-testing-container">
      <Header />

      <div className="testing-layout">
        <div className="control-section">
          <AlgorithmSelector
            algorithms={algorithms}
            selectedAlgorithm={selectedAlgorithm}
            onAlgorithmChange={setSelectedAlgorithm}
            disabled={isRunning}
          />

          <FunctionSelector
            selectedFunction={selectedFunction}
            onFunctionChange={setSelectedFunction}
            disabled={isRunning}
          />

          {algorithmParams.length > 0 && (
            <ParameterInput
              params={algorithmParams}
              onParamChange={setParamValues}
              disabled={isRunning}
            />
          )}

          <ControlPanel
            algorithms={algorithms}
            selectedAlgorithm={selectedAlgorithm}
            isRunning={isRunning}
            progress={progress}
            testResults={testResults}
            onStart={startTest}
            onStop={stopTest}
          />
        </div>

        <div className="log-panel">
          <LogsPanel logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTesting;
