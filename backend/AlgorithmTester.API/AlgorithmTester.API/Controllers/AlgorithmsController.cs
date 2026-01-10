using Microsoft.AspNetCore.Mvc;
using AlgorithmTester.API.Models;
using AlgorithmTester.API.DTOs;
using AlgorithmTester.Infrastructure.Algorithms;
using AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;
using AlgorithmTester.Domain.Interfaces;

namespace AlgorithmTester.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlgorithmsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAlgorithms()
    {
        var algorithms = new List<Algorithm>
        {
            new Algorithm { Id = "Genetic", Name = "Genetic Algorithm", Description = "Evolutionary algorithm for optimization" }
        };

        return Ok(algorithms);
    }

    [HttpGet("{algorithmName}")]
    public IActionResult GetAlgorithmDetails(string algorithmName)
    {
        try
        {
            Console.WriteLine($"Fetching algorithm details for: {algorithmName}");
            
            IOptimizationAlgorithm algorithm = algorithmName switch
            {
                "Genetic" => new GeneticAlgorithm(
                    populationSize: 50,
                    generations: 100,
                    startGeneration: 0,
                    geneCount: 2,
                    minValue: -5.0,
                    maxValue: 5.0,
                    mutationProbability: 0.01,
                    crossoverProbability: 0.8,
                    fitnessFunction: x => Math.Pow(x[0], 2) + Math.Pow(x[1], 2)
                ),
                _ => throw new ArgumentException($"Unknown algorithm: {algorithmName}")
            };

            Console.WriteLine($"Algorithm created: {algorithm.Name}");
            Console.WriteLine($"ParamsInfo count: {algorithm.ParamsInfo?.Count ?? 0}");

            var algorithmDetails = new AlgorithmDetailsDto
            {
                Id = algorithmName,
                Name = algorithm.Name,
                Description = algorithmName == "Genetic" ? "Evolutionary algorithm for optimization" : "Unknown",
                Params = algorithm.ParamsInfo?.Select(p => new AlgorithmParameterDto
                {
                    Name = p.Name,
                    Description = p.Description,
                    LowerBoundary = double.IsNegativeInfinity(p.LowerBoundary) ? null : p.LowerBoundary,
                    UpperBoundary = double.IsPositiveInfinity(p.UpperBoundary) ? null : p.UpperBoundary
                }).ToList() ?? new List<AlgorithmParameterDto>()
            };

            Console.WriteLine("Algorithm details response prepared successfully");
            return Ok(algorithmDetails);
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"ArgumentException: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in GetAlgorithmDetails: {ex.GetType().Name} - {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
        }
    }
}
