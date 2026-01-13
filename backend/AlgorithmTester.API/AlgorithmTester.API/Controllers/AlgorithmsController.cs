using Microsoft.AspNetCore.Mvc;
using AlgorithmTester.API.Models;
using AlgorithmTester.API.DTOs;
using AlgorithmTester.Infrastructure.Algorithms;
using AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;
using AlgorithmTester.Domain.Interfaces;
using AlgorithmTester.Infrastructure.Algorithms.Particle_Swarm_Optimization;
using AlgorithmTester.Infrastructure.Reports;

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
            new Algorithm { Id = "Genetic", Name = "Genetic Algorithm", Description = "Evolutionary algorithm for optimization" },
            new Algorithm { Id = "Particle Swarm Optimization", Name = "Particle Swarm Optimization", Description = "Bio-inspired algorithm that finds optimal solutions by simulating the social behavior" }
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
                    yMinValue: -5.0,
                    yMaxValue: 5.0,
                    mutationProbability: 0.01,
                    crossoverProbability: 0.8,
                    fitnessFunction: x => Math.Pow(x[0], 2) + Math.Pow(x[1], 2)
                ),
                "Particle Swarm Optimization" => new ParticleSwarmOptimization(
                    swarmSize: 50,
                    iterations: 100,
                    dimensions: 2,
                    minValue: -5.0,
                    maxValue: 5.0,
                    yMinValue: -5.0,
                    yMaxValue: 5.0,
                    w: 0.5,
                    c1: 1.5,
                    c2: 1.5,
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
                Description = algorithmName == "Genetic" ? "Evolutionary algorithm for optimization" 
                : "Bio-inspired algorithm that finds optimal solutions by simulating the social behavior",
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

    [HttpPost("download-pdf")]
    public IActionResult DownloadAlgorithmPdf([FromBody] object reportData)
    {
        try
        {
            var pdfGenerator = new PdfReportGenerator();
            var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var jsonString = System.Text.Json.JsonSerializer.Serialize(reportData);
            
            // Try to parse as AlgorithmReport first
            try
            {
                var algorithmReport = System.Text.Json.JsonSerializer.Deserialize<AlgorithmTester.Infrastructure.Reports.AlgorithmReport>(jsonString, options);
                if (algorithmReport != null)
                {
                    var pdfBytes = pdfGenerator.GenerateAlgorithmPdf(algorithmReport);
                    string fileName = $"AlgorithmReport_{algorithmReport.AlgorithmInfo.AlgorithmName}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                    return File(pdfBytes, "application/pdf", fileName);
                }
            }
            catch { }

            // Try to parse as FunctionReport
            try
            {
                var functionReport = System.Text.Json.JsonSerializer.Deserialize<AlgorithmTester.Infrastructure.Reports.FunctionReport>(jsonString, options);
                if (functionReport != null)
                {
                    var pdfBytes = pdfGenerator.GenerateFunctionPdf(functionReport);
                    string fileName = $"FunctionReport_{functionReport.FunctionInfo.FunctionName}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                    return File(pdfBytes, "application/pdf", fileName);
                }
            }
            catch { }

            return BadRequest(new { error = "Unable to parse report data" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in DownloadAlgorithmPdf: {ex.Message}");
            return StatusCode(500, new { error = "Failed to generate PDF", details = ex.Message });
        }
    }
}
