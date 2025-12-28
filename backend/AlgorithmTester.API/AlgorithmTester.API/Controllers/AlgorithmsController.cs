using Microsoft.AspNetCore.Mvc;
using AlgorithmTester.API.Models;

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
            new Algorithm { Id = "bubble_sort", Name = "Bubble Sort", Description = "Simple sorting algorithm" },
            new Algorithm { Id = "quick_sort", Name = "Quick Sort", Description = "Fast divide-and-conquer sorting" },
            new Algorithm { Id = "merge_sort", Name = "Merge Sort", Description = "Stable divide-and-conquer sorting" },
            new Algorithm { Id = "linear_search", Name = "Linear Search", Description = "Sequential search algorithm" },
            new Algorithm { Id = "binary_search", Name = "Binary Search", Description = "Logarithmic search algorithm" }
        };

        return Ok(algorithms);
    }
}
