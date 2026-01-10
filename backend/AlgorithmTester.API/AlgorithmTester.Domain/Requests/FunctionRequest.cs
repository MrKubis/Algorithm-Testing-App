namespace AlgorithmTester.Domain.Requests;

public class FunctionRequest : IRequest
{
    public string FunctionName { get; set; }
    public int Steps { get; set; }
    public double minValue { get; set; }
    public double maxValue { get; set; }
    public AlgorithmInfo[] AlgorithmList { get; set; }
    
    public bool isValidated()
    {
        if (Steps < 1) throw new Exception("Steps ammount must be bigger than 0");
        if (minValue >= maxValue) throw new Exception("minValue must be smaller than maxValue");
        return true;
    }
}