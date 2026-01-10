using AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;

namespace AlgorithmTester.Infrastructure.Algorithms;

public class AlgorithmState
{
    public required Dictionary<string, double> Parameters { get; set; }
    public int CurrentGeneration { get; set; }
    public int GenerationCount { get; set; }
    public required List<IndividualState> Population { get; set; }
    public double[]? XBest { get; set; }
    public double FBest { get; set; }
    public int EvaluationsCount { get; set; }
}
