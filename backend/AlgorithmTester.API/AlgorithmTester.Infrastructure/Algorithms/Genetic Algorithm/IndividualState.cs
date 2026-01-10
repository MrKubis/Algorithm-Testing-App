using AlgorithmTester.Domain.Interfaces;

namespace AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm
{
    public class IndividualState : IArgumentState
    {
    public required double[] Genes { get; set; }
    public double Fitness { get; set; }

    }
}
