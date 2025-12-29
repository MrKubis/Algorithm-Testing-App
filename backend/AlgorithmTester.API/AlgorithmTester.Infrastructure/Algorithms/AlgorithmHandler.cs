using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.requests;
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

                    double[] X = request.Arguments;
                    
                    // Start tej funkcji -> raport
                    for (int j = request.Step; j < request.Steps; j++)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        // X = algorithm.Solve(function, X);
                        // Dodać jakoś te X[] do raportu
                        //
                    }
                    // Koniec tej funkcji -> raport
                    // X best, fitnessValue, itp.
                }
            }
            //Obsługa przerwania
            catch (OperationCanceledException)
            {

            }
            finally
            {
                
            }
            return;

        }
    }
}
