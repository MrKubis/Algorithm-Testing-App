using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Interfaces;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Infractructure;

namespace AlgorithmTester.Infrastructure.Algorithms
{
    public class AlgorithmHandler
    {
        public static async Task RunAlgorithmAsync(
            AlgorithmRequest request,
            CancellationToken cancellationToken)
        
        {
            try
            {
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


                    // Start tej funkcji -> raport
                    for (int j = request.Step; j < request.Steps; j++)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        algorithm.Solve(function, X);
                        // Dodać jakoś te X[] do raportu
                        //
                    }
                    // Koniec tej funkcji -> raport
                    // X best, fitnessValue, itp.
                    // Wyniki
                    Console.WriteLine($"\n=== Wyniki dla {request.FunctionList[i]} ===");
                    Console.WriteLine($"FBest: {algorithm.FBest}");
                    Console.WriteLine($"XBest: [{string.Join(", ", algorithm.XBest)}]");
                    foreach (var (arg, idx) in X.Select((a, i) => (a, i)))
                    {
                        Console.WriteLine($"Argument[{idx}]: [{string.Join(", ", arg.Values)}]");
                    }
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
