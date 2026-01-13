import React, { useEffect, useRef, useState } from "react";
import { FunctionSelector } from "../components/FunctionSelector";
import { TestResults, TestResult } from "../components/TestResults";
import AlgorithmService, { Algorithm, AlgorithmParam } from "../services/AlgorithmService";
import AlgorithmWebSocketService from "../services/AlgorithmWebSocketService";
import { Log } from "../components/LogEntry";
import "../css/AlgorithmTesting.css";

const BEST_PARAM_PRESETS: Record<string, Record<string, number>> = {
  Genetic: {
    populationSize: 120,
    generations: 250,
    mutationProbability: 0.08,
    crossoverProbability: 0.9,
    geneCount: 2,
  },
  "Particle Swarm Optimization": {
    swarmSize: 60,
    iterations: 250,
    dimensions: 2,
    w: 0.729,
    c1: 1.49445,
    c2: 1.49445,
  },
};

// Reuse domain helpers
const getFunctionDefaults = (funcName: string) => {
  switch (funcName) {
    case "Rosenbrock": return { min: -2.048, max: 2.048 };
    case "Rastragin": return { min: -5.12, max: 5.12 };
    case "Beale": return { min: -4.5, max: 4.5 };
    case "Bukin": return { min: -15.0, max: -5.0 };
    default: return { min: -5.0, max: 5.0 };
  }
};

const getFunctionYDefaults = (funcName: string) => {
  switch (funcName) {
    case "Bukin": return { min: -3.0, max: 3.0 };
    case "Beale": return getFunctionDefaults(funcName);
    default: return getFunctionDefaults(funcName);
  }
};

const clampToParamBounds = (params: AlgorithmParam[], name: string, value: number) => {
  const def = params.find(p => p.name === name);
  if (!def) return value;
  let adjusted = value;
  if (def.lowerBoundary !== null && adjusted < def.lowerBoundary) adjusted = def.lowerBoundary;
  if (def.upperBoundary !== null && adjusted > def.upperBoundary) adjusted = def.upperBoundary;
  return adjusted;
};

const applyBestPresets = (
  params: AlgorithmParam[],
  values: Record<string, number>,
  algorithmId: string,
  funcName: string
) => {
  const isTwoDimensional = funcName === "Beale" || funcName === "Bukin";
  const forcedDims = isTwoDimensional ? { geneCount: 2, dimensions: 2 } : {};
  const presets = { ...BEST_PARAM_PRESETS[algorithmId], ...forcedDims };

  Object.entries(presets).forEach(([key, val]) => {
    values[key] = clampToParamBounds(params, key, val);
  });

  return values;
};

interface RunResult {
  algorithmId: string;
  algorithmName: string;
  status: "pending" | "running" | "completed" | "error";
  result?: TestResult;
  error?: string;
}

const FunctionTesting: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>("Sphere");
  const [results, setResults] = useState<RunResult[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const wsRef = useRef<AlgorithmWebSocketService | null>(null);
  const cancelRef = useRef<boolean>(false);
  const pauseRef = useRef<boolean>(false);
  const currentAlgoIndexRef = useRef<number>(0);

  useEffect(() => {
    const load = async () => {
      const list = await AlgorithmService.getAlgorithms();
      setAlgorithms(list);
    };
    load();
    return () => {
      if (wsRef.current) wsRef.current.disconnect();
    };
  }, []);

  const addLog = (message: string, type: Log["type"] = "info") => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const applyDomains = (params: AlgorithmParam[], funcName: string) => {
    const domain = getFunctionDefaults(funcName);
    return params.map(p => {
      if (p.name === "minValue") return { ...p, lowerBoundary: domain.min, upperBoundary: domain.max };
      if (p.name === "maxValue") return { ...p, lowerBoundary: domain.min, upperBoundary: domain.max };
      return p;
    });
  };

  const addYParamsIfNeeded = (params: AlgorithmParam[], funcName: string) => {
    const isBealeOrBukin = funcName === "Beale" || funcName === "Bukin";
    if (!isBealeOrBukin) return params;
    const yDomain = getFunctionYDefaults(funcName);
    const yParams: AlgorithmParam[] = [
      {
        name: "YminValue",
        description: "Y dimension minimum value",
        defaultValue: yDomain.min,
        lowerBoundary: yDomain.min,
        upperBoundary: yDomain.max,
      },
      {
        name: "YmaxValue",
        description: "Y dimension maximum value",
        defaultValue: yDomain.max,
        lowerBoundary: yDomain.min,
        upperBoundary: yDomain.max,
      },
    ];
    // insert Y right after maxValue if present
    const idx = params.findIndex(p => p.name === "maxValue");
    if (idx >= 0) {
      return [...params.slice(0, idx + 1), ...yParams, ...params.slice(idx + 1)];
    }
    return [...params, ...yParams];
  };

  const buildParamValues = (params: AlgorithmParam[], funcName: string, algorithmId: string) => {
    const domain = getFunctionDefaults(funcName);
    const yDomain = getFunctionYDefaults(funcName);
    const values: Record<string, number> = {};

    params.forEach(p => {
      values[p.name] = p.defaultValue ?? p.lowerBoundary ?? 1;
    });

    values.minValue = domain.min;
    values.maxValue = domain.max;

    if (funcName === "Beale" || funcName === "Bukin") {
      values.YminValue = yDomain.min;
      values.YmaxValue = yDomain.max;
    }

    return applyBestPresets(params, values, algorithmId, funcName);
  };

  const runForAlgorithm = async (algo: Algorithm, funcName: string): Promise<RunResult> => {
    const baseResult: RunResult = { algorithmId: algo.id, algorithmName: algo.name, status: "running" };
    const startTime = performance.now();
    try {
      addLog(`Starting ${algo.name}...`, "info");
      const details = await AlgorithmService.getAlgorithmDetails(algo.id);
      const withBounds = applyDomains(details.params, funcName);
      const withY = addYParamsIfNeeded(withBounds, funcName);
      const paramValues = buildParamValues(withY, funcName, algo.id);

      // steps
      const steps = paramValues.generations || paramValues.iterations || 100;
      const domain = getFunctionDefaults(funcName);
      const yDomain = getFunctionYDefaults(funcName);

      const functionConfig: any = {
        FunctionName: funcName,
        minValue: paramValues.minValue ?? domain.min,
        maxValue: paramValues.maxValue ?? domain.max,
      };
      if (funcName === "Beale" || funcName === "Bukin") {
        functionConfig.YminValue = paramValues.YminValue ?? yDomain.min;
        functionConfig.YmaxValue = paramValues.YmaxValue ?? yDomain.max;
      }

      const request = {
        Type: "Algorithm",
        Body: {
          AlgorithmName: algo.id,
          ParamValues: paramValues,
          Steps: steps,
          FunctionList: [functionConfig],
        },
      };

      wsRef.current = new AlgorithmWebSocketService();

      await new Promise<void>(async (resolve) => {
        await wsRef.current!.connect((message: any) => {
          // Handle log messages (generation updates)
          if (typeof message === "object" && message?.type === "log") {
            addLog(`[${algo.name}] ${message.message}`, "info");
            return;
          }

          if (typeof message === "object" && message?.AlgorithmInfo) {
            const endTime = performance.now();
            const executionTimeMs = endTime - startTime;
            const executionTimeStr = executionTimeMs < 1000 
              ? `${executionTimeMs.toFixed(0)}ms`
              : `${(executionTimeMs / 1000).toFixed(2)}s`;
            
            const result: TestResult = {
              algorithm: message.AlgorithmInfo.AlgorithmName || algo.name,
              status: "Completed",
              executionTime: executionTimeStr,
              stepsCount: message.StepsCount || steps,
              evaluations: message.Evaluations || [],
              paramValues: message.AlgorithmInfo.ParamValues || paramValues,
              rawData: message,
            };
            setResults(prev => prev.map(r => r.algorithmId === algo.id ? { ...r, status: "completed", result } : r));
            addLog(`${algo.name} completed with best: ${result.evaluations?.[result.evaluations.length - 1]?.FBest?.toExponential(4) || 'N/A'} (${executionTimeStr})`, "success");
            resolve();
          }
          if (typeof message === "string" && message === "done") {
            resolve();
          }
          if (message?.error) {
            addLog(`Error (${algo.name}): ${message.error}`, "error");
            setResults(prev => prev.map(r => r.algorithmId === algo.id ? { ...r, status: "error", error: message.error } : r));
            resolve();
          }
        });

        wsRef.current!.sendRequest(request);
        await new Promise(res => setTimeout(res, 300));
        wsRef.current!.sendCommand("START");
      });

      wsRef.current.disconnect();
      return baseResult;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      addLog(`Error (${algo.name}): ${msg}`, "error");
      return { ...baseResult, status: "error", error: msg };
    }
  };

  const startRun = async () => {
    if (!selectedFunction) {
      addLog("Please select a function", "error");
      return;
    }

    // Fresh start
    cancelRef.current = false;
    pauseRef.current = false;
    currentAlgoIndexRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);
    setLogs([]);
    setResults(algorithms.map(a => ({ algorithmId: a.id, algorithmName: a.name, status: "pending" })));
    addLog(`Starting benchmark: ${selectedFunction}`, "info");
    addLog(`Running ${algorithms.length} algorithm(s) with tuned parameters`, "info");

    try {
      for (let i = currentAlgoIndexRef.current; i < algorithms.length; i++) {
        const algo = algorithms[i];
        currentAlgoIndexRef.current = i;
        
        if (cancelRef.current) {
          addLog("Run cancelled by user", "warning");
          break;
        }
        
        // Wait while paused
        while (pauseRef.current && !cancelRef.current) {
          if (!isPaused) {
            setIsPaused(true);
            addLog("Paused - click Resume to continue", "warning");
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (cancelRef.current) {
          addLog("Run cancelled by user", "warning");
          break;
        }
        
        setResults(prev => prev.map(r => r.algorithmId === algo.id ? { ...r, status: "running" } : r));
        await runForAlgorithm(algo, selectedFunction);
        
        // Check pause after each algorithm completes
        while (pauseRef.current && !cancelRef.current) {
          if (!isPaused) {
            setIsPaused(true);
            addLog("Paused - click Resume to continue", "warning");
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (cancelRef.current) {
          addLog("Run cancelled by user", "warning");
          break;
        }
      }
      if (!cancelRef.current && !pauseRef.current) {
        addLog("All algorithms completed", "success");
        currentAlgoIndexRef.current = 0;
      }
    } finally {
      if (!isPaused && !pauseRef.current) {
        setIsRunning(false);
        setIsPaused(false);
        currentAlgoIndexRef.current = 0;
      }
    }
  };

  const pauseRun = () => {
    pauseRef.current = true;
    setIsPaused(true);
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.sendCommand("PAUSE");
      addLog("Pausing algorithm execution...", "warning");
    } else {
      addLog("Will pause after current algorithm...", "warning");
    }
  };

  const stopRun = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    if (wsRef.current) {
      if (wsRef.current.isConnected()) {
        wsRef.current.sendCommand("STOP");
      }
      wsRef.current.disconnect();
    }
    addLog("Stopping run...", "warning");
    setIsRunning(false);
    setIsPaused(false);
    currentAlgoIndexRef.current = 0;
  };

  return (
    <div className="algorithm-testing-container function-testing">
      <div className="header page-header">
        <h1>Function Testing</h1>
        <p>Run every algorithm with tuned defaults against the selected benchmark.</p>
      </div>
      <div className="testing-layout">
        <div className="control-section sticky-controls">
          <FunctionSelector
            selectedFunction={selectedFunction}
            onFunctionChange={setSelectedFunction}
            disabled={isRunning}
          />
          <div className="button-group full-width">
            <button 
              className="button button-primary run-button-fixed" 
              onClick={() => {
                if (isPaused) {
                  // Resume
                  pauseRef.current = false;
                  setIsPaused(false);
                  if (wsRef.current && wsRef.current.isConnected()) {
                    wsRef.current.sendCommand("RESUME");
                    addLog("Resuming algorithm execution...", "info");
                  }
                } else if (isRunning) {
                  // Pause
                  pauseRun();
                } else {
                  // Start fresh
                  startRun();
                }
              }}
              disabled={!selectedFunction}
              style={{ flex: 1 }}
            >
              {isPaused ? "▶ Resume" : isRunning ? "⏸ Pause" : "▶ Run Across Algorithms"}
            </button>
            {(isRunning || isPaused) && (
              <button 
                className="button button-danger run-button-fixed" 
                onClick={stopRun}
                style={{ flex: 0.3 }}
              >
                ⏹ Stop
              </button>
            )}
          </div>
          <div className="card log-card">
            <h3>Logs</h3>
            <div className="logs-container compact">
              {logs.length === 0 && <p className="muted-text">No logs yet.</p>}
              {logs.map((l, idx) => (
                <div
                  key={idx}
                  className={`log-line ${l.type === "error" ? "log-line-error" : l.type === "warning" ? "log-line-warning" : "log-line-info"}`}
                >
                  <span className="log-time">[{l.timestamp}]</span> {l.message}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="log-panel">
          {results.length === 0 && <p className="muted-text">Select a function and run to see results for each algorithm.</p>}
          <div className="function-results-stack">
            {results.map(r => {
              const statusLabel = r.status === "completed" ? "Completed" : r.status === "running" ? "Running" : r.status === "error" ? "Error" : "Pending";
              return (
                <div key={r.algorithmId} className="card result-card">
                  <div className="result-card__header">
                    <h3>{r.algorithmName}</h3>
                    <span className={`status-chip status-${r.status}`}>{statusLabel}</span>
                  </div>
                  {r.error && <p className="error-text">Error: {r.error}</p>}
                  {r.result && <TestResults results={r.result} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionTesting;
