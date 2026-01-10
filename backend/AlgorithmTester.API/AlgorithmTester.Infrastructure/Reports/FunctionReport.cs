using AlgorithmTester.Domain.Requests;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class FunctionReport
    {
        public FunctionInfo FunctionInfo { get; set; }
        public int StepsCount { get; set; }
        public List<AlgorithmEvaluation> Evaluations {get; set;}
    }
}
