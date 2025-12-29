using System.ComponentModel.DataAnnotations;

namespace AlgorithmTester.Domain.Requests;

public class AlgorithmRequest
{
    public string AlgorithmName {get; set;}
    public Dictionary<string, double> ParamValues {get; set;}
    public int Step {get; set;}
    public int Steps {get; set;}
    public double[] ArgValues {get; set;}
    public string[] FunctionList {get; set;}
}