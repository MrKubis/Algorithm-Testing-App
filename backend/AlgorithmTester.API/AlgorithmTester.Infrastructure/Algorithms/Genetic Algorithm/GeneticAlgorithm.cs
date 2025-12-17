using System.Text.Json;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Interfaces;

namespace AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;

public class GeneticAlgorithm : IOptimizationAlgorithm
{
    // --- Właściwości Interfejsu ---
    public string Name { get; set; } = "Genetic Algorithm";
    public double[] XBest { get; set; }
    public double FBest { get; set; } = double.MaxValue;
    public int NumberOfEvaluationFitnessFunction { get; set; }

    // --- DO ZROBIENIA ---
    public List<ParamInfo> ParamsInfo { get; set; } = new List<ParamInfo>{
        new ParamInfo{
            Name = "populationSize",
            Description = "Number of individuals in a generation",
            UpperBoundary = double.PositiveInfinity,
            LowerBoundary=1
        },
        new ParamInfo{
            Name = "generations",
            Description = "Number of generations",
            UpperBoundary = double.PositiveInfinity,
            LowerBoundary=1
        },
        new ParamInfo{
            Name = "geneCount",
            Description = "How many genes does one individual have",
            UpperBoundary = double.PositiveInfinity,
            LowerBoundary=1
        },
        new ParamInfo{
            Name = "minValue",
            Description = "Minimal value of X",
            UpperBoundary = double.PositiveInfinity,
            LowerBoundary=double.NegativeInfinity
        },
        new ParamInfo{
            Name = "maxValue",
            Description = "Maximal value of X",
            UpperBoundary = double.PositiveInfinity,
            LowerBoundary=double.NegativeInfinity
        },
        new ParamInfo{
            Name = "mutationProbability",
            Description = "Probability of mutating an individual during crossover",
            UpperBoundary = 1,
            LowerBoundary=0
        },
        new ParamInfo{
            Name = "crossoverProbability",
            Description = "Probability of crossing two individuals",
            UpperBoundary = double.PositiveInfinity,
            LowerBoundary=1
        }
    }
;
public IStateWriter writer { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public IStateReader reader { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public IGenerateTextReport stringReportGenerator { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public IGeneratePDFReport pdfReportGenerator { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

    // --- Parametry Konfiguracyjne ---
    private readonly int _populationSize;
    private readonly int _generations;
    private readonly int _geneCount;
    private readonly double _minValue;
    private readonly double _maxValue;
    private readonly double _mutationProbability;
    private readonly double _crossoverProbability;
    private readonly Func<double[], double> _fitnessFunction;

    private readonly Random _random;
    private const string StateFileName = "algorithm_state.json";

    public GeneticAlgorithm(
        int populationSize,
        int generations,
        int geneCount,
        double minValue,
        double maxValue,
        double mutationProbability,
        double crossoverProbability,
        Func<double[], double> fitnessFunction)
    {
        _populationSize = populationSize;
        _generations = generations;
        _geneCount = geneCount;
        _minValue = minValue;
        _maxValue = maxValue;
        _mutationProbability = mutationProbability;
        _crossoverProbability = crossoverProbability;
        _fitnessFunction = fitnessFunction;
        _random = new Random();
    }

    public double Solve()
    {
        List<Individual> population = null;
        int startGeneration = 0;
        bool stateLoaded = false;

        if (File.Exists(StateFileName))
        {
            try
            {
                var state = LoadState();
                if (ValidateParameters(state))
                {
                    Console.WriteLine($"[INFO] Plik stanu zgodny z konfiguracją. Wznawianie od generacji {state.CurrentGeneration}.");

                    startGeneration = state.CurrentGeneration;
                    NumberOfEvaluationFitnessFunction = state.EvaluationsCount;
                    XBest = state.XBest;
                    FBest = state.FBest;

                    population = state.Population.Select(p => new Individual(_geneCount)
                    {
                        Genes = p.Genes,
                        Fitness = p.Fitness
                    }).ToList();

                    stateLoaded = true;
                }
                else
                {
                    Console.WriteLine("[WARN] Plik stanu istnieje, ale parametry (np. mutacja, populacja) są inne niż w obecnej konfiguracji. Stan zignorowany.");
                    File.Delete(StateFileName);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BLAD] Błąd odczytu stanu: {ex.Message}. Rozpoczynam od nowa.");
            }
        }

        if (!stateLoaded)
        {
            Console.WriteLine("[INFO] Start nowych obliczeń.");
            NumberOfEvaluationFitnessFunction = 0;
            FBest = double.MaxValue;
            population = InitializePopulation();
            EvaluatePopulation(population);
            UpdateGlobalBest(population);
        }

        if (startGeneration >= _generations)
        {
            Console.WriteLine("[INFO] Algorytm zakończony we wcześniejszym przebiegu.");
            return FBest;
        }

        for (int i = startGeneration; i < _generations; i++)
        {
            List<Individual> newPopulation = new List<Individual>();
            newPopulation.Add(population.OrderBy(x => x.Fitness).First().Clone());
            double progress = (double)i / _generations;

            while (newPopulation.Count < _populationSize)
            {
                Individual parent1 = TournamentSelection(population, 3);
                Individual parent2 = TournamentSelection(population, 3);
                Individual child1, child2;

                if (_random.NextDouble() < _crossoverProbability)
                {
                    var children = ArithmeticCrossover(parent1, parent2);
                    child1 = children.Item1;
                    child2 = children.Item2;
                }
                else
                {
                    child1 = parent1.Clone();
                    child2 = parent2.Clone();
                }

                GaussianMutation(child1, progress);
                GaussianMutation(child2, progress);

                newPopulation.Add(child1);
                if (newPopulation.Count < _populationSize) newPopulation.Add(child2);
            }

            population = newPopulation;
            EvaluatePopulation(population);
            UpdateGlobalBest(population);

            SaveCurrentState(i + 1, population);

            if ((i + 1) % 10 == 0 || i == _generations - 1)
                Console.WriteLine($"[GEN {i + 1}] Najlepsza wartość FBest: {FBest}, Liczba ewaluacji: {NumberOfEvaluationFitnessFunction}");
        }
        File.Delete(StateFileName);
        return FBest;
    }

    private bool ValidateParameters(AlgorithmState state)
    {
        if (state.Parameters == null) return false;
        var currentParams = GetCurrentParameters();

        foreach (var kvp in currentParams)
        {
            if (!state.Parameters.ContainsKey(kvp.Key))
            {
                Console.WriteLine($"[WALIDACJA] Brak parametru w pliku: {kvp.Key}");
                return false;
            }

            double savedValue = state.Parameters[kvp.Key];
            if (Math.Abs(savedValue - kvp.Value) > 0.000001)
            {
                Console.WriteLine($"[WALIDACJA] Niezgodność parametru '{kvp.Key}'. Zapisany: {savedValue}, Obecny: {kvp.Value}");
                return false;
            }
        }
        return true;
    }

    private Dictionary<string, double> GetCurrentParameters()
    {
        return new Dictionary<string, double>
        {
            { "PopulationSize", _populationSize },
            { "Generations", _generations },
            { "GeneCount", _geneCount },
            { "MinValue", _minValue },
            { "MaxValue", _maxValue },
            { "MutationProbability", _mutationProbability },
            { "CrossoverProbability", _crossoverProbability }
        };
    }

    private void SaveCurrentState(int nextGenerationIndex, List<Individual> population)
    {
        var state = new AlgorithmState
        {
            Parameters = GetCurrentParameters(),

            CurrentGeneration = nextGenerationIndex,
            EvaluationsCount = NumberOfEvaluationFitnessFunction,
            XBest = this.XBest,
            FBest = this.FBest,
            Population = population.Select(ind => new IndividualState
            {
                Genes = ind.Genes,
                Fitness = ind.Fitness
            }).ToList()
        };

        var options = new JsonSerializerOptions { WriteIndented = true };
        string jsonString = JsonSerializer.Serialize(state, options);
        File.WriteAllText(StateFileName, jsonString);
    }

    private AlgorithmState LoadState()
    {
        string jsonString = File.ReadAllText(StateFileName);
        return JsonSerializer.Deserialize<AlgorithmState>(jsonString);
    }
    private List<Individual> InitializePopulation()
    {
        var pop = new List<Individual>(_populationSize);
        for (int i = 0; i < _populationSize; i++)
        {
            var ind = new Individual(_geneCount);
            for (int j = 0; j < _geneCount; j++) ind.Genes[j] = _minValue + (_random.NextDouble() * (_maxValue - _minValue));
            pop.Add(ind);
        }
        return pop;
    }
    private void EvaluatePopulation(List<Individual> population)
    {
        foreach (var ind in population)
        {
            ind.Fitness = _fitnessFunction(ind.Genes);
            NumberOfEvaluationFitnessFunction++;
        }
    }
    private void UpdateGlobalBest(List<Individual> population)
    {
        var currentBest = population.OrderBy(x => x.Fitness).First();
        if (XBest == null || currentBest.Fitness < FBest) { FBest = currentBest.Fitness; XBest = (double[])currentBest.Genes.Clone(); }
    }
    private Individual TournamentSelection(List<Individual> population, int tournamentSize)
    {
        Individual best = null;
        for (int i = 0; i < tournamentSize; i++) { Individual ind = population[_random.Next(population.Count)]; 
            if (best == null || ind.Fitness < best.Fitness) best = ind; }
        return best;
    }
    private (Individual, Individual) ArithmeticCrossover(Individual p1, Individual p2)
    {
        var c1 = new Individual(_geneCount);
        var c2 = new Individual(_geneCount);
        double alpha = _random.NextDouble();

        for (int i = 0; i < _geneCount; i++)
        {
            c1.Genes[i] = alpha * p1.Genes[i] + (1 - alpha) * p2.Genes[i];
            c2.Genes[i] = (1 - alpha) * p1.Genes[i] + alpha * p2.Genes[i];
        }
        return (c1, c2);
    }
    private void GaussianMutation(Individual ind, double progress)
    {
        double startSigma = (_maxValue - _minValue) * 0.1;

        double endSigma = (_maxValue - _minValue) * 0.0001;

        double currentSigma = startSigma * Math.Pow(endSigma / startSigma, progress);

        for (int i = 0; i < _geneCount; i++)
        {
            if (_random.NextDouble() < _mutationProbability)
            {
                double u1 = 1.0 - _random.NextDouble();
                double u2 = 1.0 - _random.NextDouble();
                double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);

                ind.Genes[i] += randStdNormal * currentSigma;

                if (ind.Genes[i] < _minValue) ind.Genes[i] = _minValue;
                if (ind.Genes[i] > _maxValue) ind.Genes[i] = _maxValue;
            }
        }
    }
}