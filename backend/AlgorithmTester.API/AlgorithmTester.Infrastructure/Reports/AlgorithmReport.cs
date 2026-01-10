
using AlgorithmTester.Domain.Requests;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class AlgorithmReport
    {
        public AlgorithmInfo AlgorithmInfo { get; set; }
        public int StepsCount { get; set; }
        public List<FunctionEvaluation> Evaluations { get; set; }
        }
}
