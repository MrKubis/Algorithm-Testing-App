
namespace AlgorithmTester.Infrastructure.Reports
{
    public class AlgorithmReport
    {
        public string[] Functions { get; set; }
        public Dictionary<string, double> Parameters { get; set;}
        public int StepsCount;
        public List<Evaluation> Evaluations { get; set; }
        }
}
