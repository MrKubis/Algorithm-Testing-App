using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Interfaces;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Infractructure;
using AlgorithmTester.Infrastructure.Reports;

namespace AlgorithmTester.Infrastructure.Algorithms
{
    public class AlgorithmHandler
    {
        public delegate Task LogMessageDelegate(string message);
        public delegate Task ProgressDelegate(int progress);
        private static LogMessageDelegate? _logCallback;
        private static ProgressDelegate? _progressCallback;

        public static void SetLogCallback(LogMessageDelegate callback)
        {
            _logCallback = callback;
        }
        public static void SetProgressCallback(ProgressDelegate callback) => _progressCallback = callback;

        private static async Task SendLog(string message)
        {
            Console.WriteLine($"[SendLog] Called with message: {message}");
            if (_logCallback != null)
            {
                Console.WriteLine($"[SendLog] Callback exists, calling it...");
                await _logCallback(message);
                // Small delay to ensure message is sent before next log
                await Task.Delay(10);
            }
            else
            {
                Console.WriteLine($"[SendLog] No callback set!");
            }
        }

        public static async Task RunAlgorithmAsync(
            IRequest req,
            string requestType,
            ReportGenerator reportGenerator,
            ManualResetEventSlim pauseEvent,
            CancellationToken cancellationToken)  
        {
            try
            {
                switch (requestType)
                {
                    case "Algorithm":
                    {
                        var request = (AlgorithmRequest)req;
                        await SendLog("Created request");
                        await SendLog($"Algorithm: {request.AlgorithmName}");
                        await SendLog($"Steps: {request.Steps}");
                        reportGenerator.CreateNewAlgorithmReport(request);
                        await SendLog("Created New Algorithm Report");
                        
                        for (int i = 0; i < request.FunctionList.Length; i++)
                        {
                            pauseEvent.Wait(cancellationToken);
                            cancellationToken.ThrowIfCancellationRequested();
                            if (_progressCallback != null) await _progressCallback(0);
                            await SendLog($"Starting function {i + 1}/{request.FunctionList.Length}: {request.FunctionList[i].FunctionName}");
                            
                            Func<double[], double> function = FunctionFactory.Create(request.FunctionList[i].FunctionName);
                            IOptimizationAlgorithm algorithm = AlgorithmFactory.Create(
                                request.AlgorithmName, request.ParamValues, request.Step, request.Steps, request.FunctionList[i].minValue, request.FunctionList[i].maxValue , function);
                            Argument[] x = HandleArguments(request.Arguments, algorithm);

                            reportGenerator.CreateEvaluation(request.FunctionList[i].FunctionName, request.FunctionList[i].minValue, request.FunctionList[i].maxValue);
                            
                            for (int j = request.Step; j < request.Steps; j++)
                            {
                                pauseEvent.Wait(cancellationToken);
                                cancellationToken.ThrowIfCancellationRequested();
                                algorithm.Solve(function, x);
                                reportGenerator.Evaluate(i, algorithm.XFinal, algorithm.XBest, algorithm.FBest);
                                
                                // Send progress log every 5% generations or at the end
                                if ((j + 1) % 5 == 0 || j == request.Steps - 1)
                                {
                                    int currentProgress = (int)((double)(j + 1) / request.Steps * 100);
                                    
                                    // Call the callback if it exists
                                    if (_progressCallback != null) 
                                    {
                                        await _progressCallback(currentProgress);
                                    }
                                    
                                    await SendLog($"Generation {j + 1}/{request.Steps}: Best = {algorithm.FBest:E4}");
                                }
                            }
                            await SendLog($"Completed function {request.FunctionList[i].FunctionName}");
                        }
                        break;
                    }
                    case "Function":
                    {
                        var request = (FunctionRequest)req;
                        
                        Func<double[], double> function = FunctionFactory.Create(request.FunctionName);
                        reportGenerator.CreateNewFunctionReport(request);
                        for (int i = 0; i < request.AlgorithmList.Length; i++)
                        {
                            cancellationToken.ThrowIfCancellationRequested();
                            IOptimizationAlgorithm algorithm = AlgorithmFactory.Create(request.AlgorithmList[i].AlgorithmName, request.AlgorithmList[i].ParamValues, 0,request.Steps,request.minValue,request.maxValue ,function);
                            Argument[] X = HandleArguments(null, algorithm);
                            reportGenerator.CreateEvaluation(request.AlgorithmList[i].AlgorithmName, request.minValue, request.maxValue);
                            for(int j = 0 ; j < request.Steps; j++)
                            {
                                     algorithm.Solve(function, X); 
                                     reportGenerator.Evaluate(i,algorithm.XFinal, algorithm.XBest, algorithm.FBest);
                            }
                        }    
                        break;
                    }
                }
            }
            //Obsługa przerwania
            catch (OperationCanceledException)
            {
                return;
            }
            finally
            {
            }
        }
        private static Argument[] HandleArguments(Argument[]? arguments, IOptimizationAlgorithm algorithm)
        {
            if (arguments == null || arguments.Length == 0)
            {
                return algorithm.GenerateArguments();
            }

            else
            {
                return arguments.Select(arg => new Argument
                {
                    Values = (double[])arg.Values.Clone()
                }).ToArray();
            }
        }
    }
}
