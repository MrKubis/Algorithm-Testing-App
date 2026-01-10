import React, { useState, useRef, useEffect } from "react";
import { Header } from "../components/Header";
import { AlgorithmSelector, Algorithm } from "../components/AlgorithmSelector";
import { FunctionSelector } from "../components/FunctionSelector";
import { ParameterInput } from "../components/ParameterInput";
import { ControlPanel } from "../components/ControlPanel";
import { LogsPanel } from "../components/LogsPanel";
import { TestResults, TestResult } from "../components/TestResults";
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

  const getFunctionDefaults = (funcName: string) => {
    switch (funcName) {
      case "Rosenbrock": return { min: -2.048, max: 2.048 };
      case "Rastragin": return { min: -5.12, max: 5.12 };
      case "Beale": return { min: -4.5, max: 4.5 };
      case "Bukin": return { min: -15.0, max: -5.0 };
      default: return { min: -5.0, max: 5.0 };
    }
  };
  const currentDefaults = getFunctionDefaults(selectedFunction);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        const data = await AlgorithmService.getAlgorithms();
        setAlgorithms(data);
      } catch (error) {
        setAlgorithmError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoadingAlgorithms(false);
      }
    };

    fetchAlgorithms();
    wsServiceRef.current = new AlgorithmWebSocketService();

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, []);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load algorithm parameters
  useEffect(() => {
    const loadAlgorithmDetails = async () => {
      if (!selectedAlgorithm) {
        setAlgorithmParams([]);
        return;
      }
      try {
        const details = await AlgorithmService.getAlgorithmDetails(selectedAlgorithm);
        setAlgorithmParams(details.params);
      } catch (error) {
        addLog(`Failed to load params: ${error}`, "error");
      }
    };
    loadAlgorithmDetails();
  }, [selectedAlgorithm]);

  const addLog = (message: string, type: Log["type"] = "info"): void => {
    setLogs((prev) => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const startTest = async (): Promise<void> => {
    if (!selectedAlgorithm) {
      addLog("Please select an algorithm first", "error");
      return;
    }

    const paramErrors = AlgorithmService.validateParams(paramValues, algorithmParams);
    if (paramErrors.length > 0) {
      paramErrors.forEach(error => addLog(error, "error"));
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setProgress(0);
    setLogs([]);
    setTestResults(null);
    abortControllerRef.current = new AbortController();

    const algorithmName = algorithms.find((a) => a.id === selectedAlgorithm)?.name;
    addLog(`Starting test for ${algorithmName}...`, "info");

    try {
      if (wsServiceRef.current) {
        // Disconnect existing to ensure clean slate
        if(wsServiceRef.current.isConnected()) {
             wsServiceRef.current.disconnect();
        }

        await wsServiceRef.current.connect((message: any) => {
          
          if (typeof message === "string" && message === "done") {
             addLog("Algorithm execution completed", "success");
             setIsRunning(false);
             setIsPaused(false);
             return;
          }

          // Handle Object Messages
          if (typeof message === "object" && message !== null) {
            if (message.type === "log") {
              addLog(message.message, "info");
              return;
            }
            if (message.error) {
              addLog(`Error: ${message.error}`, "error");
              setIsRunning(false);
              setIsPaused(false);
            }
            if (message.status) {
              addLog(message.status, "info");
            }
            if (message.progress) {
              setProgress(message.progress);
            }
            
            // Handle Final Report
            if (message.AlgorithmInfo || message.FunctionInfo || message.AlgorithmReport) {
               
               setTestResults({
                  algorithm: algorithmName || "Unknown",
                  status: "Completed",
                  executionTime: "0", 
                  operationsCount: 0, 
                  memoryUsed: "0"
                });
                setProgress(100);
            }
          }
        });
      }

      const userDefinedGenerations = paramValues["generations"]; 
      const steps = userDefinedGenerations ? userDefinedGenerations : 100;
      let defaultMin = -5.0;
      let defaultMax = 5.0;
      
      if (selectedFunction === "Rosenbrock") {
        defaultMin = -2.048; defaultMax = 2.048;
      } else if (selectedFunction === "Rastragin") {
        defaultMin = -5.12; defaultMax = 5.12;
      } else if (selectedFunction === "Beale") {
        defaultMin = -4.5; defaultMax = 4.5;
      } else if (selectedFunction === "Bukin") {
        defaultMin = -15.0; defaultMax = -5.0;
      }

      const userMin = paramValues["minValue"];
      const finalMin = userMin !== undefined ? userMin : defaultMin;

      const userMax = paramValues["maxValue"];
      const finalMax = userMax !== undefined ? userMax : defaultMax;

      const request = {
        Type: "Algorithm",
        Body: {
          AlgorithmName: selectedAlgorithm,
          ParamValues: paramValues,
          Steps: steps,
          FunctionList: [
            {
              FunctionName: selectedFunction,
              minValue: finalMin,
              maxValue: finalMax
            }
          ]
        }
      };

      if (wsServiceRef.current) {
        wsServiceRef.current.sendRequest(request);
        await new Promise((resolve) => setTimeout(resolve, 500));
        wsServiceRef.current.sendCommand("START");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`, "error");
      
      setIsRunning(false);
      setIsPaused(false);
    } 
  };

  const stopTest = (): void => {
    if (wsServiceRef.current && wsServiceRef.current.isConnected()) {
      wsServiceRef.current.sendCommand("STOP");
      addLog("Sent STOP command", "info");
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setIsPaused(false);
    addLog("Test stopped by user", "warning");
  };

  const pauseTest = () => {
    if (wsServiceRef.current && wsServiceRef.current.isConnected()) {
      wsServiceRef.current.sendCommand("PAUSE");
      setIsPaused(true); 
    }
  };

  const resumeTest = () => {
    if (wsServiceRef.current && wsServiceRef.current.isConnected()) {
      wsServiceRef.current.sendCommand("RESUME");
      setIsPaused(false);
    }
  };

  const clearLogs = (): void => {
    setLogs([]);
  };

  if (loadingAlgorithms) return <div className="loading">Loading algorithms...</div>;
  if (algorithmError) return <div className="error">{algorithmError}</div>;

  return (
    <div className="algorithm-testing-container">
      <Header />
      <div className="testing-layout">
        <div className="control-section">
          <ControlPanel
            algorithms={algorithms}
            selectedAlgorithm={selectedAlgorithm}
            isRunning={isRunning}
            isPaused={isPaused}
            progress={progress}
            onStart={startTest}
            onStop={stopTest}
            onPause={pauseTest}
            onResume={resumeTest}
          />
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
              defaultOverrides={{
                minValue: currentDefaults.min,
                maxValue: currentDefaults.max
              }}
            />
          )}
        </div>
        <div className="log-panel">
          <LogsPanel logs={logs} onClear={clearLogs} />
          <TestResults results={testResults} />
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTesting;