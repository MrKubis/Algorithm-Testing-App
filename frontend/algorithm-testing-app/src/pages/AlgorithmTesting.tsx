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
  // Y-domain defaults (for 2D functions)
  const getFunctionYDefaults = (funcName: string) => {
    switch (funcName) {
      case "Bukin": return { min: -3.0, max: 3.0 }; // Bukin y in [-3,3]
      case "Beale": return getFunctionDefaults(funcName); // Same as X for Beale
      default: return getFunctionDefaults(funcName);
    }
  };
  const currentDefaults = getFunctionDefaults(selectedFunction);
  const currentYDefaults = getFunctionYDefaults(selectedFunction);

  // Update algorithm parameters with domain boundaries based on selected function
  const updateParamsWithDomainBoundaries = (params: AlgorithmParam[], funcName: string) => {
    const domain = getFunctionDefaults(funcName);
    return params.map(param => {
      if (param.name === "xMinValue" || param.name === "minValue") {
        return { ...param, lowerBoundary: domain.min, upperBoundary: domain.max };
      }
      if (param.name === "xMaxValue" || param.name === "maxValue") {
        return { ...param, lowerBoundary: domain.min, upperBoundary: domain.max };
      }
      return param;
    });
  };

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
  const [isBealeOrBukin, setIsBealeOrBukin] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load algorithm parameters
  useEffect(() => {
    const loadAlgorithmDetails = async () => {
      if (!selectedAlgorithm) {
        setAlgorithmParams([]);
        return;
      }
      try {
        let details = await AlgorithmService.getAlgorithmDetails(selectedAlgorithm);
        // Rename min/max to xMin/xMax on frontend
        const renamedParams = details.params.map(p => {
          if (p.name === "minValue") return { ...p, name: "xMinValue", description: "X min" };
          if (p.name === "maxValue") return { ...p, name: "xMaxValue", description: "X max" };
          return p;
        });
        // Apply domain boundaries based on selected function
        let updatedParams = updateParamsWithDomainBoundaries(renamedParams, selectedFunction);
        
        // For Beale and Bukin functions, add Y dimension parameters
        const isBealOrBukinFunc = selectedFunction === "Beale" || selectedFunction === "Bukin";
        if (isBealOrBukinFunc) {
          const domain = getFunctionDefaults(selectedFunction);
          const yDomain = getFunctionYDefaults(selectedFunction);
          const yParams = [
            {
              name: "YminValue",
              description: "Y dimension minimum value",
              defaultValue: yDomain.min,
              lowerBoundary: yDomain.min,
              upperBoundary: yDomain.max
            },
            {
              name: "YmaxValue",
              description: "Y dimension maximum value",
              defaultValue: yDomain.max,
              lowerBoundary: yDomain.min,
              upperBoundary: yDomain.max
            }
          ];
          const insertIndex = Math.max(
            updatedParams.findIndex(p => p.name === "xMaxValue"),
            updatedParams.findIndex(p => p.name === "xMinValue")
          );
          if (insertIndex >= 0) {
            const before = updatedParams.slice(0, insertIndex + 1);
            const after = updatedParams.slice(insertIndex + 1);
            updatedParams = [...before, ...yParams, ...after];
          } else {
            updatedParams = [...updatedParams, ...yParams];
          }
        }
        
        setAlgorithmParams(updatedParams);
      } catch (error) {
        addLog(`Failed to load params: ${error}`, "error");
      }
    };
    loadAlgorithmDetails();
  }, [selectedAlgorithm, selectedFunction]);

  // Update domain boundaries when selected function changes
  useEffect(() => {
    if (algorithmParams.length > 0) {
      const domain = getFunctionDefaults(selectedFunction);
      const yDomain = getFunctionYDefaults(selectedFunction);
      const isBealOrBukinFunc = selectedFunction === "Beale" || selectedFunction === "Bukin";
      
      let updatedParams = updateParamsWithDomainBoundaries(algorithmParams, selectedFunction);
      
      // Update Y parameters if they exist, or add them if Beale/Bukin
      if (isBealOrBukinFunc) {
        const hasYParams = updatedParams.some(p => p.name === "YminValue" || p.name === "YmaxValue");
        if (!hasYParams) {
          const yParams = [
            {
              name: "YminValue",
              description: "Y dimension minimum value",
              defaultValue: yDomain.min,
              lowerBoundary: yDomain.min,
              upperBoundary: yDomain.max
            },
            {
              name: "YmaxValue",
              description: "Y dimension maximum value",
              defaultValue: yDomain.max,
              lowerBoundary: yDomain.min,
              upperBoundary: yDomain.max
            }
          ];
          const insertIndex = Math.max(
            updatedParams.findIndex(p => p.name === "xMaxValue"),
            updatedParams.findIndex(p => p.name === "xMinValue")
          );
          if (insertIndex >= 0) {
            const before = updatedParams.slice(0, insertIndex + 1);
            const after = updatedParams.slice(insertIndex + 1);
            updatedParams = [...before, ...yParams, ...after];
          } else {
            updatedParams = [...updatedParams, ...yParams];
          }
        } else {
          // Update existing Y parameters with new domain
          updatedParams = updatedParams.map(p => {
            if (p.name === "YminValue" || p.name === "YmaxValue") {
              return { ...p, lowerBoundary: yDomain.min, upperBoundary: yDomain.max };
            }
            return p;
          });
        }
      } else {
        // Remove Y parameters if not Beale/Bukin
        updatedParams = updatedParams.filter(p => p.name !== "YminValue" && p.name !== "YmaxValue");
      }
      
      setAlgorithmParams(updatedParams);
      
      // Update param values with new domain
      setParamValues(prev => {
        const updated: Record<string, number> = {
          ...prev,
          xMinValue: domain.min,
          xMaxValue: domain.max
        };
        
        if (isBealOrBukinFunc) {
          updated.YminValue = yDomain.min;
          updated.YmaxValue = yDomain.max;
        } else {
          // Remove Y values if not Beale/Bukin
          delete updated.YminValue;
          delete updated.YmaxValue;
        }
        
        return updated;
      });
    }
  }, [selectedFunction]);

  // Auto-set dimensions for Beale and Bukin functions (they require exactly 2 dimensions)
  useEffect(() => {
    const isBealOrBukinFunc = selectedFunction === "Beale" || selectedFunction === "Bukin";
    setIsBealeOrBukin(isBealOrBukinFunc);
    
    if (isBealOrBukinFunc && algorithmParams.length > 0) {
      // For Genetic Algorithm, set geneCount to 2
      // For PSO, set dimensions to 2
      const updatedParams = { ...paramValues };
      let updated = false;
      if (updatedParams.hasOwnProperty("geneCount") && updatedParams["geneCount"] !== 2) {
        updatedParams["geneCount"] = 2;
        updated = true;
      }
      if (updatedParams.hasOwnProperty("dimensions") && updatedParams["dimensions"] !== 2) {
        updatedParams["dimensions"] = 2;
        updated = true;
      }
      if (updated) {
        setParamValues(updatedParams);
      }
    }
  }, [selectedFunction, algorithmParams]);

  const addLog = (message: string, type: Log["type"] = "info"): void => {
    setLogs((prev) => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const startTest = async (): Promise<void> => {
    if (!selectedAlgorithm) {
      addLog("Please select an algorithm first", "error");
      return;
    }

    // For Beale and Bukin, ensure dimensions are set to 2
    const isBealOrBukinFunc = selectedFunction === "Beale" || selectedFunction === "Bukin";
    const finalParamValues = { ...paramValues };
    if (isBealOrBukinFunc) {
      if (selectedAlgorithm.includes("Genetic")) {
        finalParamValues["geneCount"] = 2;
      } else if (selectedAlgorithm.includes("Particle")) {
        finalParamValues["dimensions"] = 2;
      }
    }

    const paramErrors = AlgorithmService.validateParams(finalParamValues, algorithmParams);
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
      // Create a fresh WebSocket service instance for this run
      wsServiceRef.current = new AlgorithmWebSocketService();
      
      console.log("=".repeat(60));
      console.log(`[Algorithm Started] ${algorithmName} with function: ${selectedFunction}`);
      console.log(`[Parameters]:`, finalParamValues);
      console.log("=".repeat(60));

      if (wsServiceRef.current) {
        await wsServiceRef.current.connect((message: any) => {
          console.log("[WebSocket Message Received]", message);
          
          if (typeof message === "string" && message === "done") {
             console.log("[DONE] Algorithm execution completed");
             addLog("Algorithm execution completed", "success");
             // Ensure UI updates by setting both flags
             setIsRunning(false);
             setIsPaused(false);
             setProgress(100);
             return;
          }

          // Handle Object Messages
          if (typeof message === "object" && message !== null) {
            console.log("[Object Message Type Check]", {
              hasType: message.type,
              hasError: message.error,
              hasStatus: message.status,
              hasProgress: message.progress,
              hasAlgorithmInfo: message.AlgorithmInfo,
              hasFunctionInfo: message.FunctionInfo,
              hasAlgorithmReport: message.AlgorithmReport,
              fullObject: message
            });

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
            if (message.AlgorithmInfo || message.Evaluations) {
               console.log("[Final Report Received]", {
                 algorithmInfo: message.AlgorithmInfo,
                 evaluations: message.Evaluations,
                 stepsCount: message.StepsCount,
                 fullPayload: message
               });
               
               setTestResults({
                  algorithm: message.AlgorithmInfo?.AlgorithmName || algorithmName || "Unknown",
                  status: "Completed",
                  executionTime: "N/A",
                  stepsCount: message.StepsCount || 0,
                  evaluations: message.Evaluations || [],
                  paramValues: message.AlgorithmInfo?.ParamValues || {},
                  rawData: message
                });
                setProgress(100);
            }
          }
        });
      }

      // Handle both "generations" (for Genetic) and "iterations" (for PSO)
      const userDefinedGenerations = finalParamValues["generations"] || finalParamValues["iterations"];
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

      const userMin = finalParamValues["xMinValue"];
      const finalMin = userMin !== undefined ? userMin : defaultMin;

      const userMax = finalParamValues["xMaxValue"];
      const finalMax = userMax !== undefined ? userMax : defaultMax;

      // For Beale and Bukin functions, add Y dimension parameters
      const isBealOrBukinFunc = selectedFunction === "Beale" || selectedFunction === "Bukin";
      let functionConfig: any = {
        FunctionName: selectedFunction,
        minValue: finalMin,
        maxValue: finalMax
      };
      
      if (isBealOrBukinFunc) {
        const yDomain = getFunctionYDefaults(selectedFunction);
        const userYMin = finalParamValues["YminValue"];
        const finalYMin = userYMin !== undefined ? userYMin : yDomain.min;
        const userYMax = finalParamValues["YmaxValue"];
        const finalYMax = userYMax !== undefined ? userYMax : yDomain.max;
        
        functionConfig = {
          ...functionConfig,
          YminValue: finalYMin,
          YmaxValue: finalYMax
        };
      }

      // Convert frontend param names back to backend expected names
      const backendParamValues: Record<string, number> = { ...finalParamValues };
      if (backendParamValues.hasOwnProperty("xMinValue")) {
        backendParamValues.minValue = backendParamValues.xMinValue;
        delete backendParamValues.xMinValue;
      }
      if (backendParamValues.hasOwnProperty("xMaxValue")) {
        backendParamValues.maxValue = backendParamValues.xMaxValue;
        delete backendParamValues.xMaxValue;
      }

      const request = {
        Type: "Algorithm",
        Body: {
          AlgorithmName: selectedAlgorithm,
          ParamValues: backendParamValues,
          Steps: steps,
          FunctionList: [functionConfig]
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
                xMinValue: currentDefaults.min,
                xMaxValue: currentDefaults.max,
                ...(isBealeOrBukin && {
                  YminValue: currentYDefaults.min,
                  YmaxValue: currentYDefaults.max
                })
              }}
              disabledParams={isBealeOrBukin ? ["geneCount", "dimensions"] : []}
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