using System.ComponentModel.DataAnnotations;

namespace AlgorithmTester.Domain.Requests;

public class AlgorithmRequest : IRequest
{
    public string AlgorithmName {get; set;}
    public Dictionary<string, double> ParamValues {get; set;}
    public int Step {get; set;}
    public int Steps {get; set;}
    public Argument[]? Arguments {get; set;}
    //Do zmiany na FunctionInfos
    public string[] FunctionList {get; set;}

    public bool isValidated()
    {
        if (Steps < 1) throw new Exception("Steps ammount must be bigger than 0");
        if (Step != 0)
        {
            if (Step < 1) throw new Exception("Step must be bigger than 0");
            if (Step > Steps) throw new Exception("Step must be smaller than Steps ammount");
            if (Arguments == null) throw new Exception("Arguments list not defined");
        }
        else
        {
            Step = 0;
        }

        //TODO sprawdzanie czy X mieœci siê w przedzia³ach

        return true;
    }
}