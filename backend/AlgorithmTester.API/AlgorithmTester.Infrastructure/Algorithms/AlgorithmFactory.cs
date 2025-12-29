using AlgorithmTester.Domain.Interfaces;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;

namespace AlgorithmTester.Infrastructure.Algorithms;

public class AlgorithmFactory
{
    public static IOptimizationAlgorithm Create(AlgorithmRequest request,  Func<double[], double> fitnessFunction)
    {
        return request.AlgorithmName switch
        {
            "Genetic" => new GeneticAlgorithm(
                request.ParamValues["populationSize"],
                request.Steps,
                request.ParamValues["geneCount"],
                request.ParamValues["minValue"],
                request.ParamValues["maxValue"],
                request.ParamValues["mutationProbability"],
                request.ParamValues["crossoverProbability"],
                fitnessFunction
            ),
            
            //default
            _ => throw new ArgumentOutOfRangeException(nameof(request.AlgorithmName), request.AlgorithmName, null)
        };
    }
}