using AlgorithmTester.Domain;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class GenerationRecord
    {
        public int Generation { get; set; }
        public double? FBest { get; set; }
        public Argument? XBest { get; set; }
    }
}
