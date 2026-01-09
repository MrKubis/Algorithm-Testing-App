using System;
using System.Collections.Generic;
using System.Linq;
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
                        reportGenerator.CreateNewAlgorithmReport(request);
                        for (int i = 0; i < request.FunctionList.Length; i++)
                        {
                            cancellationToken.ThrowIfCancellationRequested();
                            Func<double[], double> function = FunctionFactory.Create(request.FunctionList[i]);
                            IOptimizationAlgorithm algorithm = AlgorithmFactory.Create(request, function);
                            Argument[] X = HandleArguments(request.Arguments, algorithm);

                            reportGenerator.CreateEvaluation(request.FunctionList[i]);
                            for (int j = request.Step; j < request.Steps; j++)
                            {
                                cancellationToken.ThrowIfCancellationRequested();
                                algorithm.Solve(function, X);
                                reportGenerator.Evaluate(i, algorithm.XFinal, algorithm.XBest, algorithm.FBest);
                            }
                        }
                        break;
                    }

                    case "Function":
                    {
                        var request = (FunctionRequest)req;
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
