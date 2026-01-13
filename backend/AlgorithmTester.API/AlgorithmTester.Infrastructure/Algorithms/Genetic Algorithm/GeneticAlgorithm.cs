using System.Text.Json;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Interfaces;
using AlgorithmTester.Domain.Requests;

namespace AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm;

public class GeneticAlgorithm : IOptimizationAlgorithm
{
    public string Name { get; set; } = "Genetic Algorithm";
    public List<Argument> XFinal { get; set; }
    public Argument XBest { get; set; }
    public double FBest { get; set; } = double.MaxValue;
    public int NumberOfEvaluationFitnessFunction { get; set; }

    public List<ParamInfo> ParamsInfo { get; set; } = new List<ParamInfo>{
        new ParamInfo{ Name = "populationSize", Description = "Number of individuals", UpperBoundary = 10000, LowerBoundary=1 },
        new ParamInfo{ Name = "generations", Description = "Number of generations", UpperBoundary = 100000, LowerBoundary=1 },
        new ParamInfo{ Name = "geneCount", Description = "Dimensions (N)", UpperBoundary = 1000, LowerBoundary=1 },
        new ParamInfo{ Name = "minValue", Description = "Min X", UpperBoundary = double.PositiveInfinity, LowerBoundary=double.NegativeInfinity },
        new ParamInfo{ Name = "maxValue", Description = "Max X", UpperBoundary = double.PositiveInfinity, LowerBoundary=double.NegativeInfinity },
        new ParamInfo{ Name = "mutationProbability", Description = "Prob. of mutation", UpperBoundary = 1, LowerBoundary=0 },
        new ParamInfo{ Name = "crossoverProbability", Description = "Prob. of crossover", UpperBoundary = 1, LowerBoundary=0 }
    };

    public IStateWriter writer { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public IStateReader reader { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public IGenerateTextReport stringReportGenerator { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public IGeneratePDFReport pdfReportGenerator { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

    private readonly int _populationSize;
    private readonly int _generations;
    private readonly int _geneCount;
    private readonly double _minValue;
    private readonly double _maxValue;
    private readonly double _yMinValue;
    private readonly double _yMaxValue;
    private readonly double _mutationProbability;
    private readonly double _crossoverProbability;
    private readonly Func<double[], double> _fitnessFunction;

    private int _startGeneration;
    private readonly Random _random;
    private const string StateFileName = "algorithm_state.json";

    // Incremental state so each Solve() call advances one generation instead of a full run
    private List<Individual>? _population;
    private int _currentGeneration = 0;
    private bool _initialized = false;

    public GeneticAlgorithm(
        double populationSize,
        double generations,
        double startGeneration,
        double geneCount,
        double minValue,
        double maxValue,
        double yMinValue,
        double yMaxValue,
        double mutationProbability,
        double crossoverProbability,
        Func<double[], double> fitnessFunction)
    {
        _populationSize = (int)populationSize;
        _generations = (int)generations;
        _startGeneration = (int)startGeneration;
        _geneCount = (int)geneCount;
        _minValue = minValue;
        _maxValue = maxValue;
        _yMinValue = yMinValue;
        _yMaxValue = yMaxValue;
        _mutationProbability = mutationProbability;
        _crossoverProbability = crossoverProbability;
        _fitnessFunction = fitnessFunction;
        _random = new Random();
    }

    public void Solve(Func<double[], double> function, Argument[] X)
    {
        // First call: build initial population and evaluate
        if (!_initialized)
        {
            _population = InitializePopulation(X);
            EvaluatePopulation(_population, function);
            UpdateGlobalBest(_population);
            _initialized = true;
            _currentGeneration = 0;
        }
        else if (_population != null)
        {
            double progress = (double)_currentGeneration / Math.Max(1, _generations);
            _population = PerformEvolutionStep(_population, progress);
            EvaluatePopulation(_population, function);
            UpdateGlobalBest(_population);
            _currentGeneration++;
        }

        if (_population != null)
        {
            FinalizeResult(_population, X);
        }
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
                    Console.WriteLine($"[INFO] Resuming from generation {state.CurrentGeneration}.");
                    startGeneration = state.CurrentGeneration;
                    NumberOfEvaluationFitnessFunction = state.EvaluationsCount;
                    FBest = state.FBest;
                    population = state.Population.Select(p => new Individual(_geneCount) { Genes = p.Genes, Fitness = p.Fitness }).ToList();
                    stateLoaded = true;
                }
                else
                {
                    File.Delete(StateFileName);
                }
            }
            catch {}
        }

        if (!stateLoaded)
        {
            NumberOfEvaluationFitnessFunction = 0;
            FBest = double.MaxValue;
            population = InitializePopulation();
            EvaluatePopulation(population, _fitnessFunction);
            UpdateGlobalBest(population);
        }

        if (startGeneration >= _generations) return FBest;

        for (int i = startGeneration; i < _generations; i++)
        {
            double progress = (double)i / _generations;

            population = PerformEvolutionStep(population, progress);

            EvaluatePopulation(population, _fitnessFunction);
            UpdateGlobalBest(population);

            SaveCurrentState(i + 1, population);

            if ((i + 1) % 10 == 0 || i == _generations - 1)
                Console.WriteLine($"[GEN {i + 1}] Best Fitness: {FBest:F5}");
        }

        File.Delete(StateFileName);
        return FBest;
    }

    private List<Individual> PerformEvolutionStep(List<Individual> currentPopulation, double progress)
    {
        List<Individual> newPopulation = new List<Individual>();

        var bestInd = currentPopulation.OrderBy(x => x.Fitness).First();
        newPopulation.Add(bestInd.Clone());

        while (newPopulation.Count < _populationSize)
        {
            Individual parent1 = TournamentSelection(currentPopulation, 3);
            Individual parent2 = TournamentSelection(currentPopulation, 3);
            Individual child1, child2;

            if (_random.NextDouble() < _crossoverProbability)
            {
                var children = BlxAlphaCrossover(parent1, parent2);
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

        return newPopulation;
    }

    private (Individual, Individual) BlxAlphaCrossover(Individual p1, Individual p2)
    {
        var c1 = new Individual(_geneCount);
        var c2 = new Individual(_geneCount);
        double alpha = 0.5;

        for (int i = 0; i < _geneCount; i++)
        {
            double min = Math.Min(p1.Genes[i], p2.Genes[i]);
            double max = Math.Max(p1.Genes[i], p2.Genes[i]);
            double distance = max - min;

            double lower = min - (alpha * distance);
            double upper = max + (alpha * distance);

            c1.Genes[i] = lower + _random.NextDouble() * (upper - lower);
            c2.Genes[i] = lower + _random.NextDouble() * (upper - lower);

            c1.Genes[i] = Math.Clamp(c1.Genes[i], _minValue, _maxValue);
            c2.Genes[i] = Math.Clamp(c2.Genes[i], _minValue, _maxValue);
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
                ind.Genes[i] = Math.Clamp(ind.Genes[i], _minValue, _maxValue);
            }
        }
    }

    private Individual TournamentSelection(List<Individual> population, int tournamentSize)
    {
        Individual best = null;
        for (int i = 0; i < tournamentSize; i++)
        {
            Individual ind = population[_random.Next(population.Count)];
            if (best == null || ind.Fitness < best.Fitness) best = ind;
        }
        return best;
    }


    private void FinalizeResult(List<Individual> population, Argument[] X)
    {
        XFinal = new List<Argument>();
        foreach (Individual child in population)
        {
            XFinal.Add(new Argument { Values = (double[])child.Genes.Clone() });
        }

        int count = Math.Min(population.Count, X.Length);
        var sortedPop = population.OrderBy(x => x.Fitness).ToList();

        for (int i = 0; i < count; i++)
        {
            if (X[i].Values.Length == _geneCount)
            {
                Array.Copy(sortedPop[i].Genes, X[i].Values, _geneCount);
            }
        }
    }

    private void EvaluatePopulation(List<Individual> population, Func<double[], double> fitnessFunc)
    {
        foreach (var ind in population)
        {
            ind.Fitness = fitnessFunc(ind.Genes);
            NumberOfEvaluationFitnessFunction++;
        }
    }

    private void UpdateGlobalBest(List<Individual> population)
    {
        var currentBest = population.OrderBy(x => x.Fitness).First();
        if (XBest == null || currentBest.Fitness < FBest)
        {
            FBest = currentBest.Fitness;
            XBest = new Argument { Values = (double[])currentBest.Genes.Clone() };
        }
    }

    private List<Individual> InitializePopulation()
    {
        var pop = new List<Individual>(_populationSize);
        for (int i = 0; i < _populationSize; i++)
        {
            var ind = new Individual(_geneCount);
            for (int j = 0; j < _geneCount; j++)
            {
                // Use Y bounds for second dimension if geneCount > 1
                double minVal = (j == 1) ? _yMinValue : _minValue;
                double maxVal = (j == 1) ? _yMaxValue : _maxValue;
                ind.Genes[j] = minVal + (_random.NextDouble() * (maxVal - minVal));
            }
            pop.Add(ind);
        }
        return pop;
    }

    private List<Individual> InitializePopulation(Argument[] Arguments)
    {
        var population = new List<Individual>();
        foreach (var arg in Arguments)
        {
            if (arg.Values != null && arg.Values.Length == _geneCount && arg.Values.Any(v => v != 0))
            {
                var ind = new Individual(_geneCount);
                Array.Copy(arg.Values, ind.Genes, _geneCount);
                population.Add(ind);
            }
            else
            {
                var ind = new Individual(_geneCount);
                for (int j = 0; j < _geneCount; j++)
                {
                    // Use Y bounds for second dimension if geneCount > 1
                    double minVal = (j == 1) ? _yMinValue : _minValue;
                    double maxVal = (j == 1) ? _yMaxValue : _maxValue;
                    ind.Genes[j] = minVal + (_random.NextDouble() * (maxVal - minVal));
                }
                population.Add(ind);
            }
        }

        while (population.Count < _populationSize)
        {
            var ind = new Individual(_geneCount);
            for (int j = 0; j < _geneCount; j++)
            {
                // Use Y bounds for second dimension if geneCount > 1
                double minVal = (j == 1) ? _yMinValue : _minValue;
                double maxVal = (j == 1) ? _yMaxValue : _maxValue;
                ind.Genes[j] = minVal + (_random.NextDouble() * (maxVal - minVal));
            }
            population.Add(ind);
        }

        return population;
    }

    public Argument[] GenerateArguments()
    {
        Argument[] arguments = new Argument[_populationSize];
        for (int i = 0; i < _populationSize; i++)
        {
            arguments[i] = new Argument { Values = new double[_geneCount] };
            for (int j = 0; j < _geneCount; j++)
            {
                // Use Y bounds for second dimension if geneCount > 1
                double minVal = (j == 1) ? _yMinValue : _minValue;
                double maxVal = (j == 1) ? _yMaxValue : _maxValue;
                arguments[i].Values[j] = minVal + (_random.NextDouble() * (maxVal - minVal));
            }
        }
        return arguments;
    }

    private bool ValidateParameters(AlgorithmState state)
    {
        if (state.Parameters == null) return false;
        var currentParams = GetCurrentParameters();
        foreach (var kvp in currentParams)
        {
            if (!state.Parameters.ContainsKey(kvp.Key)) return false;
            if (Math.Abs(state.Parameters[kvp.Key] - kvp.Value) > 0.000001) return false;
        }
        return true;
    }

    private Dictionary<string, double> GetCurrentParameters()
    {
        return new Dictionary<string, double>
        {
            { "PopulationSize", _populationSize }, { "Generations", _generations },
            { "GeneCount", _geneCount }, { "MinValue", _minValue }, { "MaxValue", _maxValue },
            { "MutationProbability", _mutationProbability }, { "CrossoverProbability", _crossoverProbability }
        };
    }

    private void SaveCurrentState(int nextGenerationIndex, List<Individual> population)
    {
        var state = new AlgorithmState
        {
            Parameters = GetCurrentParameters(),
            CurrentGeneration = nextGenerationIndex,
            EvaluationsCount = NumberOfEvaluationFitnessFunction,
            FBest = this.FBest,
            Population = population.Select(ind => new IndividualState { Genes = ind.Genes, Fitness = ind.Fitness }).ToList()
        };
        File.WriteAllText(StateFileName, JsonSerializer.Serialize(state, new JsonSerializerOptions { WriteIndented = true }));
    }

    private AlgorithmState LoadState()
    {
        return JsonSerializer.Deserialize<AlgorithmState>(File.ReadAllText(StateFileName));
    }
}