import React, { useState, useRef, useEffect } from "react";
import { Header } from "../components/Header";
import { AlgorithmSelector, Algorithm } from "../components/AlgorithmSelector";
import { MultiFunctionSelector } from "../components/MultiFunctionSelector";
import { ParameterInput } from "../components/ParameterInput";
import { ControlPanel } from "../components/ControlPanel";
import { LogsPanel } from "../components/LogsPanel";
import { TestResults, TestResult } from "../components/TestResults";
import { FunctionResultCard } from "../components/FunctionResultCard";
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
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>(["Sphere"]);
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

  // Calculate combined domain from all selected functions (widest range)
  const getCombinedDomain = (functions: string[]) => {
    if (functions.length === 0) return { min: -5.0, max: 5.0 };
    
    const domains = functions.map(f => getFunctionDefaults(f));
    return {
      min: Math.min(...domains.map(d => d.min)),
      max: Math.max(...domains.map(d => d.max))
    };
  };

  const getCombinedYDomain = (functions: string[]) => {
    if (functions.length === 0) return { min: -5.0, max: 5.0 };
    
    const domains = functions.map(f => getFunctionYDefaults(f));
    return {
      min: Math.min(...domains.map(d => d.min)),
      max: Math.max(...domains.map(d => d.max))
    };
  };

  const currentDefaults = getCombinedDomain(selectedFunctions);
  const currentYDefaults = getCombinedYDomain(selectedFunctions);
  const hasBealeOrBukin = selectedFunctions.some(f => f === "Beale" || f === "Bukin");

  // Update algorithm parameters with domain boundaries based on combined selected functions
  const updateParamsWithDomainBoundaries = (params: AlgorithmParam[], domain: { min: number, max: number }) => {
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
  const [functionResults, setFunctionResults] = useState<Array<{
    functionName: string;
    status: "pending" | "running" | "completed" | "error";
    result?: TestResult;
    error?: string;
  }>>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isBealeOrBukin, setIsBealeOrBukin] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFunctionIndexRef = useRef<number>(0);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5046';

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
        // Apply domain boundaries based on combined selected functions
        const combinedDomain = getCombinedDomain(selectedFunctions);
        let updatedParams = updateParamsWithDomainBoundaries(renamedParams, combinedDomain);
        
        // For Beale and Bukin functions, add Y dimension parameters
        const hasBealeOrBukinFunc = selectedFunctions.some(f => f === "Beale" || f === "Bukin");
        if (hasBealeOrBukinFunc) {
          const yDomain = getCombinedYDomain(selectedFunctions);
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
  }, [selectedAlgorithm, selectedFunctions]);

  // Update domain boundaries when selected functions change
  useEffect(() => {
    if (algorithmParams.length > 0) {
      const combinedDomain = getCombinedDomain(selectedFunctions);
      const yDomain = getCombinedYDomain(selectedFunctions);
      const hasBealeOrBukinFunc = selectedFunctions.some(f => f === "Beale" || f === "Bukin");
      
      let updatedParams = updateParamsWithDomainBoundaries(algorithmParams, combinedDomain);
      
      // Update Y parameters if they exist, or add them if Beale/Bukin
      if (hasBealeOrBukinFunc) {
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
          xMinValue: combinedDomain.min,
          xMaxValue: combinedDomain.max
        };
        
        if (hasBealeOrBukinFunc) {
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
  }, [selectedFunctions]);

  // Auto-set dimensions for Beale and Bukin functions (they require exactly 2 dimensions)
  useEffect(() => {
    const hasBealeOrBukinFunc = selectedFunctions.some(f => f === "Beale" || f === "Bukin");
    setIsBealeOrBukin(hasBealeOrBukinFunc);
    
    if (hasBealeOrBukinFunc && algorithmParams.length > 0) {
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
  }, [selectedFunctions, algorithmParams]);

  const addLog = (message: string, type: Log["type"] = "info"): void => {
    setLogs((prev) => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const downloadAlgorithmReportPDF = async () => {
    try {
      const completedResults = functionResults.filter(r => r.status === "completed" && r.result);
      console.log("[PDF Download] Total functionResults:", functionResults);
      console.log("[PDF Download] Completed results count:", completedResults.length);
      console.log("[PDF Download] Completed results:", completedResults);
      
      if (completedResults.length === 0) {
        alert("No completed results to download. Please run the tests first.");
        return;
      }

      // Build a composite algorithm report from all function results
      const algorithmName = algorithms.find((a) => a.id === selectedAlgorithm)?.name || selectedAlgorithm;
      
      // Each individual result has evaluations array with one entry per function tested
      // Since we're testing sequentially, each result has 1 evaluation with all generations
      const compositeReport = {
        AlgorithmInfo: {
          AlgorithmName: algorithmName,
          ParamValues: completedResults[0]?.result?.paramValues ?? {},
        },
        StepsCount: completedResults[0]?.result?.stepsCount ?? 100,
        Evaluations: completedResults.map(r => {
          // Each result's evaluations array contains one entry for that function
          const evaluation = r.result?.evaluations?.[0] as any;
          console.log(`[PDF Download] Processing ${r.functionName}:`, {
            functionName: r.functionName,
            hasResult: !!r.result,
            evaluationsLength: r.result?.evaluations?.length,
            evaluation: evaluation,
            generations: evaluation?.Generations?.length
          });
          return {
            Function: r.functionName,
            FBest: evaluation?.FBest ?? 0,
            XBest: evaluation?.XBest ?? null,
            XFinal: evaluation?.XFinal ?? [],
            Step: evaluation?.Step ?? r.result?.stepsCount ?? 0,
            Generations: evaluation?.Generations ?? [],
            minValue: evaluation?.minValue ?? -5,
            maxValue: evaluation?.maxValue ?? 5,
            YminValue: evaluation?.YminValue,
            YmaxValue: evaluation?.YmaxValue,
          };
        }),
      };
      
      console.log("[PDF Download] Composite report:", compositeReport);
      console.log("[PDF Download] Evaluations count:", compositeReport.Evaluations.length);

      const response = await fetch(`${API_BASE}/api/algorithms/download-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compositeReport),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      link.download = `AlgorithmReport_${algorithmName}_${timestamp}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const startTest = async (): Promise<void> => {
    if (!selectedAlgorithm) {
      addLog("Please select an algorithm first", "error");
      return;
    }

    if (selectedFunctions.length === 0) {
      addLog("Please select at least one function", "error");
      return;
    }

    // Check if any selected function is Beale or Bukin
    const hasBealeOrBukin = selectedFunctions.some(f => f === "Beale" || f === "Bukin");
    const finalParamValues = { ...paramValues };
    if (hasBealeOrBukin) {
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
    setFunctionResults(selectedFunctions.map(f => ({ functionName: f, status: "pending" })));
    abortControllerRef.current = new AbortController();
    currentFunctionIndexRef.current = 0;

    const algorithmName = algorithms.find((a) => a.id === selectedAlgorithm)?.name;
    addLog(`Starting test for ${algorithmName} on ${selectedFunctions.length} function(s)...`, "info");

    try {
      // Run each function sequentially
      for (let i = 0; i < selectedFunctions.length; i++) {
        const funcName = selectedFunctions[i];
        currentFunctionIndexRef.current = i;
        
        // Update status to running for current function
        setFunctionResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: "running" } : r
        ));
        
        addLog(`Running ${algorithmName} on ${funcName}...`, "info");
        
        const result = await runFunctionTest(funcName, algorithmName!, finalParamValues);
        
        // Update result for this function
        if (result.error) {
          setFunctionResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: "error", error: result.error } : r
          ));
        } else {
          setFunctionResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: "completed", result: result.testResult } : r
          ));
        }
      }

      setProgress(100);
      setIsRunning(false);
      setIsPaused(false);
      addLog("All tests completed", "success");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`, "error");
      
      setIsRunning(false);
      setIsPaused(false);
    } 
  };

  const runFunctionTest = async (
    funcName: string, 
    algorithmName: string, 
    finalParamValues: Record<string, number>
  ): Promise<{ testResult?: TestResult; error?: string }> => {
    const startTime = performance.now();
    
    try {
      // Create a fresh WebSocket service instance for this function test
      const ws = new AlgorithmWebSocketService();
      
      const result = await new Promise<{ testResult?: TestResult; error?: string }>(async (resolve) => {
        await ws.connect((message: any) => {
          if (typeof message === "string" && message === "done") {
            console.log(`[DONE] ${funcName} execution completed`);
            resolve({});
            return;
          }

          if (typeof message === "object" && message !== null) {
            if (message.type === "log") {
              addLog(`[${funcName}] ${message.message}`, "info");
              return;
            }
            
            if (message.error) {
              addLog(`Error (${funcName}): ${message.error}`, "error");
              resolve({ error: message.error });
              return;
            }
            
            if (message.status) {
              addLog(`[${funcName}] ${message.status}`, "info");
            }
            
            // Handle Final Report
            if (message.AlgorithmInfo || message.Evaluations) {
              const endTime = performance.now();
              const executionTimeMs = endTime - startTime;
              const executionTimeStr = executionTimeMs < 1000 
                ? `${executionTimeMs.toFixed(0)}ms`
                : `${(executionTimeMs / 1000).toFixed(2)}s`;
              
              const testResult: TestResult = {
                algorithm: message.AlgorithmInfo?.AlgorithmName || algorithmName,
                status: "Completed",
                executionTime: executionTimeStr,
                stepsCount: message.StepsCount || 0,
                evaluations: message.Evaluations || [],
                paramValues: message.AlgorithmInfo?.ParamValues || {},
                rawData: message
              };
              
              addLog(`${funcName} completed with best: ${testResult.evaluations?.[testResult.evaluations.length - 1]?.FBest?.toExponential(4) || 'N/A'} (${executionTimeStr})`, "success");
              resolve({ testResult });
            }
          }
        });

        // Build function config for this specific function
        const domain = getFunctionDefaults(funcName);
        const userMin = finalParamValues["xMinValue"];
        const finalMin = userMin !== undefined ? userMin : domain.min;
        const userMax = finalParamValues["xMaxValue"];
        const finalMax = userMax !== undefined ? userMax : domain.max;

        const isBealOrBukinFunc = funcName === "Beale" || funcName === "Bukin";
        let functionConfig: any = {
          FunctionName: funcName,
          minValue: finalMin,
          maxValue: finalMax
        };
        
        if (isBealOrBukinFunc) {
          const yDomain = getFunctionYDefaults(funcName);
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

        const userDefinedGenerations = finalParamValues["generations"] || finalParamValues["iterations"];
        const steps = userDefinedGenerations ? userDefinedGenerations : 100;

        console.log(`[${funcName}] Request config:`, {
          selectedAlgorithm,
          steps,
          userDefinedGenerations,
          finalParamValues,
          backendParamValues
        });

        const request = {
          Type: "Algorithm",
          Body: {
            AlgorithmName: selectedAlgorithm,
            ParamValues: backendParamValues,
            Steps: steps,
            FunctionList: [functionConfig]
          }
        };

        console.log(`[${funcName}] Sending request:`, request);

        ws.sendRequest(request);
        await new Promise(res => setTimeout(res, 300));
        ws.sendCommand("START");
      });

      ws.disconnect();
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { error: msg };
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
          <MultiFunctionSelector
            selectedFunctions={selectedFunctions}
            onFunctionsChange={setSelectedFunctions}
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
          {functionResults.length === 0 && <p className="muted-text">Select an algorithm and functions to run tests.</p>}
          {functionResults.some(r => r.status === "completed") && (
            <div className="button-group" style={{ marginBottom: '15px' }}>
              <button
                onClick={downloadAlgorithmReportPDF}
                className="button button-primary button-small button-inline"
              >
                📄 Download Complete Report PDF
              </button>
            </div>
          )}
          <div className="function-results-stack">
            {functionResults.map((r, idx) => (
              <FunctionResultCard
                key={idx}
                functionName={r.functionName}
                status={r.status}
                result={r.result}
                error={r.error}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmTesting;