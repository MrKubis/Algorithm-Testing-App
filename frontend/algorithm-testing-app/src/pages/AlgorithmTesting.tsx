import React, { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header";
import { ControlPanel } from "../components/ControlPanel";
import { LogsPanel } from "../components/LogsPanel";
import { Log } from "../components/LogEntry";
import WebSocketService from "../services/WebSocketService";
import { AlgorithmMetadata, AlgorithmRequest } from "../types";
import "../css/AlgorithmTesting.css";

const AlgorithmTesting: React.FC = () => {
  // States
  const [algorithms, setAlgorithms] = useState<AlgorithmMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlgoName, setSelectedAlgoName] = useState<string>("");
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [paramValues, setParamValues] = useState<{ [key: string]: number }>({});
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [testResult, setTestResult] = useState<any>(null);

  // Ref
  const selectedAlgoNameRef = useRef(selectedAlgoName);
  useEffect(() => {
    selectedAlgoNameRef.current = selectedAlgoName;
  }, [selectedAlgoName]);

  // Log Helper
  const addLog = (message: string, type: Log["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      { message, type, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  // Message WS
  const handleWsMessage = (data: any) => {
    console.log("WS Message received:", data);
    setLoading(false);

    if (data.type === "INIT_ALGORITHMS") {
      const algos = data.payload as AlgorithmMetadata[];
      setAlgorithms(algos);
      addLog(`Loaded ${algos.length} algorithms`, "info");
    } else if (data.type === "RESULT") {
      setTestResult({
        algorithm: selectedAlgoNameRef.current,
        status: "Finished",
        executionTime: "N/A",
        operationsCount: 0,
        memoryUsed: "N/A",
        rawResult: data.value,
      });
      addLog(`Result received: ${data.value}`, "success");
      setIsRunning(false);
    } else if (data.type === "error") {
      addLog(`Server Error: ${data.error}`, "error");
      setIsRunning(false);
    }
  };

  // WS Connection
  useEffect(() => {
    let isMounted = true;

    if (WebSocketService.isConnected()) {
      setLoading(false);
    }

    const initSocket = async () => {
      try {
        await WebSocketService.connect("ws://localhost:5046/ws", (data) => {
          if (isMounted) handleWsMessage(data);
        });

        if (isMounted) {
          setLoading(false);
          addLog("Connected to Server", "success");
        }
      } catch (error) {
        console.error("Failed to connect:", error);
        if (isMounted) addLog("Connection Failed", "error");
      }
    };

    initSocket();

    return () => {
      isMounted = false;
      WebSocketService.disconnect();
    };
  }, []);

  // Handlers
  const handleAlgoChange = (name: string) => {
    setSelectedAlgoName(name);

    const selectedAlgo = algorithms.find((a) => a.ClassName === name);

    const defaults: { [key: string]: number } = {};

    if (selectedAlgo && selectedAlgo.ParamsInfo) {
      selectedAlgo.ParamsInfo.forEach((param) => {
        defaults[param.Name] = param.LowerBoundary;
      });
    }
    setParamValues(defaults);
  };

  const handleParamChange = (name: string, value: number) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  // Actions
  const startTest = () => {
    if (!WebSocketService.isConnected()) {
      addLog("WebSocket not connected", "error");
      return;
    }

    setTestResult(null);
    setIsRunning(true);
    addLog("Sending configuration...", "info");

    const request: AlgorithmRequest = {
      AlgorithmName: selectedAlgoName,
      Parameters: paramValues,
      FunctionList: [selectedFunction],
    };

    WebSocketService.sendRequest(request);

    setTimeout(() => {
      WebSocketService.sendCommand("start");
      addLog("Algorithm started...", "info");
    }, 100);
  };

  const stopTest = () => {
    WebSocketService.sendCommand("stop");
    addLog("Stop command sent", "warning");
    setIsRunning(false);
  };

  if (loading) return <div className="loading">Connecting to server...</div>;

  return (
    <div className="algorithm-testing-container">
      <Header />
      <div className="testing-layout">
        <ControlPanel
          algorithms={algorithms}
          selectedAlgorithm={selectedAlgoName}
          parameterValues={paramValues}
          selectedFunction={selectedFunction}
          isRunning={isRunning}
          progress={0}
          testResults={testResult}
          onAlgorithmChange={handleAlgoChange}
          onParameterChange={handleParamChange}
          onFunctionChange={setSelectedFunction}
          onStart={startTest}
          onStop={stopTest}
        />
        <div className="log-panel">
          <LogsPanel logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTesting;
