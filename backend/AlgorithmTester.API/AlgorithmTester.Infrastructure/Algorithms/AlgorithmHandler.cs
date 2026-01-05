using AlgorithmTester.Domain.requests;
using System.Reflection;
using AlgorithmTester.Infrastructure; 

// Jeśli Twój typ 'fitnessFunction' jest w namespace AlgorithmTester.Domain, dodaj ten using:
using AlgorithmTester.Domain; 

namespace AlgorithmTester.Infrastructure.Algorithms
{
    public class AlgorithmHandler
    {
        // Zaktualizowana sygnatura z callbackiem
        public static async Task RunAlgorithmAsync(
            AlgorithmRequest request,
            Func<string, Task> sendUpdateCallback, // Callback do WebSocketa
            CancellationToken cancellationToken)
        {
            string functionName = request.FunctionList != null && request.FunctionList.Length > 0 
                                  ? request.FunctionList[0] 
                                  : "RastraginFunction";

            Func<double[], double> selectedFunc = functionName switch
            {
                "RosenbrockFunction" => FunctionProvider.RosenbrockFunction,
                "SphereFunction"     => FunctionProvider.SphereFunction,
                "BealeFunction"      => FunctionProvider.BealeFunction,
                "BukinFunction"      => FunctionProvider.BukinFunction,
                "RastraginFunction"  => FunctionProvider.RastraginFunction
            };

            var p = request.Parameters;
            IOptimizationAlgorithm algorithm = null;

            if (request.AlgorithmName == "GeneticAlgorithm")
            {
                 algorithm = new GeneticAlgorithm(
                    populationSize: (int)p["populationSize"],
                    generations: (int)p["generations"],
                    geneCount: (int)p["geneCount"],
                    minValue: p["minValue"],
                    maxValue: p["maxValue"],
                    mutationProbability: p["mutationProbability"],
                    crossoverProbability: p["crossoverProbability"]
                );
            }
            
            if (algorithm == null) throw new Exception($"Algorytm {request.AlgorithmName} nieznany.");

            await Task.Run(async () => 
            {
                double[] domain = new double[] { p["minValue"], p["maxValue"] };
                
                double result = algorithm.Solve(selectedFunc, domain);

                var message = System.Text.Json.JsonSerializer.Serialize(new 
                { 
                    type = "RESULT", 
                    value = result 
                });
                
                await sendUpdateCallback(message);

            }, cancellationToken);
        }
    }
}