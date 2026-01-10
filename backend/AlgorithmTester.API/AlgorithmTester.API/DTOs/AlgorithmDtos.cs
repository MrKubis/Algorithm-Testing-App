namespace AlgorithmTester.API.DTOs;

public class AlgorithmParameterDto
{
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public double? LowerBoundary { get; set; }
    public double? UpperBoundary { get; set; }
}

public class AlgorithmDetailsDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public List<AlgorithmParameterDto> Params { get; set; } = new();
}
