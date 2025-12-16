using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Infractructure;
using AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;

namespace AlgorithmTester.Infrastructure.Algorithms;

public class AlgorithmState
{
    public required Dictionary<string, double> Parameters { get; set; }

    public int CurrentGeneration { get; set; }
    public required List<IndividualState> Population { get; set; }
    public required double[] XBest { get; set; }
    public double FBest { get; set; }
    public int EvaluationsCount { get; set; }
}
