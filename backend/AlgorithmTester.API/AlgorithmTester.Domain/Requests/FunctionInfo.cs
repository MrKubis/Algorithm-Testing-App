namespace AlgorithmTester.Domain.Requests;

public class FunctionInfo
{
    public string FunctionName { get; set; }
    public double minValue { get; set; }
    public double maxValue { get; set; }
    public double? YminValue { get; set; }
    public double? YmaxValue { get; set; }
}