namespace AlgorithmTester.Domain.Requests;

public class FunctionRequest : IRequest
{
    public string FunctionName { get; set; }
    public int Step {  get; set; }
    public int Steps { get; set; }
    public List<AlgorithmInfo> Algorithms { get; set; }
    public string[] AlgorithmList { get; set; }
}