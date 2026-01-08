using System;
using System.Collections.Generic;
using System.Linq;
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
            AlgorithmRequest request,
            ReportGenerator reportGenerator,
            CancellationToken cancellationToken)  
        {
            try
            {
                reportGenerator.CreateNewAlgorithmReport(request);

                for (int i = 0; i < request.FunctionList.Length; i++)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    Func<double[], double> function = FunctionFactory.Create(request.FunctionList[i]);
                    IOptimizationAlgorithm algorithm = AlgorithmFactory.Create(request, function);
                    Console.WriteLine("Performing algorithm: " + request.AlgorithmName + " on function : " + request.FunctionList[i]);

                    Argument[] X;

                    if (request.Arguments == null || request.Arguments.Length == 0)
                    {
                        X = algorithm.GenerateArguments();
                    }

                    else
                    {
                        Console.WriteLine(request.Arguments.Length);
                        X = request.Arguments.Select(arg => new Argument
                        {
                            Values = (double[])arg.Values.Clone()
                        }).ToArray();
                    }

                    for (int j = request.Step; j < request.Steps; j++)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        algorithm.Solve(function, X);
                    }
                    reportGenerator.CreateEvaluation(request.FunctionList[i],algorithm.XFinal,algorithm.XBest,algorithm.FBest);
                   }
                return;
            }
            //Obsługa przerwania
            catch (OperationCanceledException)
            {

            }
            finally
            {
                Console.WriteLine("[INFO] Zakończono RunAlgorithmAsync");
            }
        }
    }
}
