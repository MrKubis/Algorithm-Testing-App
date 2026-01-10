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
        public static async Task RunAlgorithmAsync(
            IRequest req,
            string requestType,
            ReportGenerator reportGenerator,
            CancellationToken cancellationToken)  
        {
            try
            {
                switch (requestType)
                {
                    case "Algorithm":
                    {
                        var request = (AlgorithmRequest)req;
                        Console.WriteLine("Created request");
                        Console.WriteLine(request.AlgorithmName);
                        Console.WriteLine(request.ParamValues);
                        reportGenerator.CreateNewAlgorithmReport(request);
                        Console.WriteLine("Created New Algorithm Report");
                        
                        Console.Write(request.FunctionList.Length);
                        for (int i = 0; i < request.FunctionList.Length; i++)
                        {
                            cancellationToken.ThrowIfCancellationRequested();
                            Func<double[], double> function = FunctionFactory.Create(request.FunctionList[i].FunctionName);
                            IOptimizationAlgorithm algorithm = AlgorithmFactory.Create(
                                request.AlgorithmName, request.ParamValues, request.Step, request.Steps, request.FunctionList[i].minValue, request.FunctionList[i].maxValue , function);
                            Argument[] x = HandleArguments(request.Arguments, algorithm);

                            reportGenerator.CreateEvaluation(request.FunctionList[i].FunctionName, request.FunctionList[i].minValue, request.FunctionList[i].maxValue);
                            for (int j = request.Step; j < request.Steps; j++)
                            {
                                cancellationToken.ThrowIfCancellationRequested();
                                algorithm.Solve(function, x);
                                reportGenerator.Evaluate(i, algorithm.XFinal, algorithm.XBest, algorithm.FBest);
                            }
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
