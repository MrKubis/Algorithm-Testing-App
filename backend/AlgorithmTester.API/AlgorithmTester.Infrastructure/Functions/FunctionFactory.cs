namespace AlgorithmTester.Infractructure;

public class FunctionFactory
{
    public static Func<double[], double> Create(string FunctionName)
    {
        return FunctionName switch
        {
            "Rastragin" => FunctionProvider.RastraginFunction,
            "Rosenbrock" => FunctionProvider.RosenbrockFunction,
            "Sphere" => FunctionProvider.SphereFunction,
            "Beale" => FunctionProvider.BealeFunction,
            "Bukin" => FunctionProvider.BukinFunction,
            _ => throw new ArgumentOutOfRangeException(nameof(FunctionName), FunctionName, null)
        };
    }
}