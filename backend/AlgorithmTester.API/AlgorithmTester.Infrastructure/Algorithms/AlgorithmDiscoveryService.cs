using System.Reflection;
using AlgorithmTester.Domain;

namespace AlgorithmTester.Infrastructure.Algorithms;

public static class AlgorithmDiscoveryService
{
    public static List<object> GetAllAlgorithmsMetadata()
    {
        var algorithmType = typeof(IOptimizationAlgorithm);
        var algorithms = Assembly.GetExecutingAssembly()
            .GetTypes()
            .Where(t => algorithmType.IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
            .ToList();

        var metadataList = new List<object>();

        foreach (var type in algorithms)
        {
            try 
            {
                var instance = Activator.CreateInstance(type) as IOptimizationAlgorithm;

                if (instance != null)
                {
                    metadataList.Add(new 
                    {
                        ClassName = type.Name,
                        ParamsInfo = instance.ParamsInfo 
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load metadata for {type.Name}: {ex.Message}");
            }
        }
        return metadataList;
    }
}