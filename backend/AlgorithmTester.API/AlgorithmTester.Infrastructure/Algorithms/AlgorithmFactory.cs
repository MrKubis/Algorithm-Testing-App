using AlgorithmTester.Domain.Interfaces;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;
using AlgorithmTester.Infrastructure.Algorithms.Particle_Swarm_Optimization;

namespace AlgorithmTester.Infrastructure.Algorithms;

public class AlgorithmFactory
{
    public static IOptimizationAlgorithm Create(string algorithmName, 
                                                Dictionary<string,double> paramValues,
                                                int step,
                                                int steps , 
                                                double minValue,
                                                double maxValue,
                                                Func<double[], double> fitnessFunction)
    {
        return algorithmName switch
        {
            "Genetic" => new GeneticAlgorithm(
                paramValues["populationSize"],
                steps,
                step,
                paramValues["geneCount"],
                minValue,
                maxValue,
                paramValues["mutationProbability"],
                paramValues["crossoverProbability"],
                fitnessFunction
            ),
            "Particle Swarm Optimization" => new ParticleSwarmOptimization(
                paramValues["swarmSize"],
                paramValues["iterations"],
                paramValues["dimensions"],
                minValue,
                maxValue,
                paramValues["w"],
                paramValues["c1"],
                paramValues["c2"],
                fitnessFunction
            ),

            //default
            _ => throw new ArgumentOutOfRangeException(nameof(algorithmName), algorithmName, null)
        };
    }
}