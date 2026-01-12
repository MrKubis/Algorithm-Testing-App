using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AlgorithmTester.Infrastructure.Algorithms.Particle_Swarm_Optimization
{
    public class ParticleSwarmOptimization : IOptimizationAlgorithm
    {
        public string Name { get; set; } = "Particle Swarm Optimization";
        public List<Argument> XFinal { get; set; }
        public Argument XBest { get; set; }
        public double FBest { get; set; } = double.MaxValue;
        public int NumberOfEvaluationFitnessFunction { get; set; }

        public List<ParamInfo> ParamsInfo { get; set; } = new List<ParamInfo>{
        new ParamInfo{ Name = "swarmSize", Description = "Number of particles", UpperBoundary = 10000, LowerBoundary=1 },
        new ParamInfo{ Name = "iterations", Description = "Number of iterations", UpperBoundary = 100000, LowerBoundary=1 },
        new ParamInfo{ Name = "dimensions", Description = "Dimensions (N)", UpperBoundary = 1000, LowerBoundary=1 },
        new ParamInfo{ Name = "minValue", Description = "Min X boundary", UpperBoundary = double.PositiveInfinity, LowerBoundary=double.NegativeInfinity },
        new ParamInfo{ Name = "maxValue", Description = "Max X boundary", UpperBoundary = double.PositiveInfinity, LowerBoundary=double.NegativeInfinity },
        new ParamInfo{ Name = "w", Description = "Inertia Weight (0.4 - 0.9)", UpperBoundary = 1.5, LowerBoundary=0 },
        new ParamInfo{ Name = "c1", Description = "Cognitive Coefficient (Personal trust)", UpperBoundary = 4, LowerBoundary=0 },
        new ParamInfo{ Name = "c2", Description = "Social Coefficient (Swarm trust)", UpperBoundary = 4, LowerBoundary=0 }
    };

        public IStateWriter writer { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
        public IStateReader reader { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
        public IGenerateTextReport stringReportGenerator { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
        public IGeneratePDFReport pdfReportGenerator { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

        private readonly int _swarmSize;
        private readonly int _iterations;
        private readonly int _dimensions;
        private readonly double _minValue;
        private readonly double _maxValue;

        private readonly double _w;
        private readonly double _c1;
        private readonly double _c2;

        private readonly Func<double[], double> _fitnessFunction;
        private readonly Random _random;
        private const string StateFileName = "pso_state.json";

        public ParticleSwarmOptimization(
            double swarmSize,
            double iterations,
            double dimensions,
            double minValue,
            double maxValue,
            double w,
            double c1,
            double c2,
            Func<double[], double> fitnessFunction)
        {
            _swarmSize = (int)swarmSize;
            _iterations = (int)iterations;
            _dimensions = (int)dimensions;
            _minValue = minValue;
            _maxValue = maxValue;
            _w = w;
            _c1 = c1;
            _c2 = c2;
            _fitnessFunction = fitnessFunction;
            _random = new Random();
        }

        public void Solve(Func<double[], double> function, Argument[] X)
        {
            var swarm = InitializeSwarm(X);
            EvaluateSwarm(swarm, function);
            UpdateGlobalBest(swarm);

            for (int i = 0; i < _iterations; i++)
            {
                UpdateParticlesVelocityAndPosition(swarm);
                EvaluateSwarm(swarm, function);
                UpdateGlobalBest(swarm);
            }

            FinalizeResult(swarm, X);
        }

        public double Solve()
        {
            List<Particle> swarm = null;
            int startIteration = 0;
            bool stateLoaded = false;

            if (File.Exists(StateFileName))
            {
                try
                {
                    var state = LoadState();
                    if (ValidateParameters(state))
                    {
                        Console.WriteLine($"[INFO PSO] Wznawianie od iteracji {state.CurrentIteration}.");
                        startIteration = state.CurrentIteration;
                        NumberOfEvaluationFitnessFunction = state.EvaluationsCount;
                        FBest = state.FBest;
                        swarm = state.Particles.Select(p => {
                            var part = new Particle(_dimensions) { BestFitness = p.BestFitness };
                            Array.Copy(p.Position, part.Position, _dimensions);
                            Array.Copy(p.Velocity, part.Velocity, _dimensions);
                            Array.Copy(p.BestPosition, part.BestPosition, _dimensions);
                            return part;
                        }).ToList();

                        if (state.GlobalBestPosition != null)
                        {
                            XBest = new Argument { Values = (double[])state.GlobalBestPosition.Clone() };
                        }

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
                swarm = InitializeSwarm();
                EvaluateSwarm(swarm, _fitnessFunction);
                UpdateGlobalBest(swarm);
            }

            if (startIteration >= _iterations) return FBest;

            for (int i = startIteration; i < _iterations; i++)
            {
                UpdateParticlesVelocityAndPosition(swarm);

                EvaluateSwarm(swarm, _fitnessFunction);
                UpdateGlobalBest(swarm);

                SaveCurrentState(i + 1, swarm);

                if ((i + 1) % 50 == 0 || i == _iterations - 1)
                {
                    Console.WriteLine($"[PSO ITER {i + 1}] FBest: {FBest:F5}");
                }
            }

            File.Delete(StateFileName);
            return FBest;
        }

        private void UpdateParticlesVelocityAndPosition(List<Particle> swarm)
        {
            if (XBest == null) return;

            double[] globalBestPos = XBest.Values;

            foreach (var p in swarm)
            {
                for (int d = 0; d < _dimensions; d++)
                {
                    double r1 = _random.NextDouble();
                    double r2 = _random.NextDouble();

                    double cognitive = _c1 * r1 * (p.BestPosition[d] - p.Position[d]);
                    double social = _c2 * r2 * (globalBestPos[d] - p.Position[d]);

                    p.Velocity[d] = (_w * p.Velocity[d]) + cognitive + social;
                    p.Position[d] += p.Velocity[d];

                    if (p.Position[d] < _minValue)
                    {
                        p.Position[d] = _minValue;
                        p.Velocity[d] *= -0.5;
                    }
                    else if (p.Position[d] > _maxValue)
                    {
                        p.Position[d] = _maxValue;
                        p.Velocity[d] *= -0.5;
                    }
                }
            }
        }

        private void EvaluateSwarm(List<Particle> swarm, Func<double[], double> function)
        {
            foreach (var p in swarm)
            {
                double fitness = function(p.Position);
                p.CurrentFitness = fitness;
                NumberOfEvaluationFitnessFunction++;

                if (fitness < p.BestFitness)
                {
                    p.BestFitness = fitness;
                    Array.Copy(p.Position, p.BestPosition, _dimensions);
                }
            }
        }

        private void UpdateGlobalBest(List<Particle> swarm)
        {
            var iterationBest = swarm.OrderBy(p => p.BestFitness).First();

            if (XBest == null || iterationBest.BestFitness < FBest)
            {
                FBest = iterationBest.BestFitness;
                XBest = new Argument { Values = (double[])iterationBest.BestPosition.Clone() };
            }
        }


        private List<Particle> InitializeSwarm(Argument[] inputArgs = null)
        {
            var swarm = new List<Particle>(_swarmSize);
            int inputCount = inputArgs != null ? inputArgs.Length : 0;

            for (int i = 0; i < _swarmSize; i++)
            {
                var p = new Particle(_dimensions);

                if (i < inputCount && inputArgs[i].Values.Length == _dimensions)
                {
                    Array.Copy(inputArgs[i].Values, p.Position, _dimensions);
                }
                else
                {
                    for (int j = 0; j < _dimensions; j++)
                    {
                        p.Position[j] = _minValue + _random.NextDouble() * (_maxValue - _minValue);
                    }
                }

                Array.Copy(p.Position, p.BestPosition, _dimensions);

                for (int j = 0; j < _dimensions; j++)
                {
                    p.Velocity[j] = (_random.NextDouble() - 0.5) * (_maxValue - _minValue) * 0.1;
                }

                swarm.Add(p);
            }
            return swarm;
        }

        private void FinalizeResult(List<Particle> swarm, Argument[] X)
        {
            XFinal = new List<Argument>();
            foreach (var p in swarm)
            {
                XFinal.Add(new Argument { Values = (double[])p.Position.Clone() });
            }

            int count = Math.Min(swarm.Count, X.Length);
            var sortedSwarm = swarm.OrderBy(p => p.BestFitness).ToList();

            for (int i = 0; i < count; i++)
            {
                if (X[i].Values.Length == _dimensions)
                {
                    Array.Copy(sortedSwarm[i].BestPosition, X[i].Values, _dimensions);
                }
            }
        }

        public Argument[] GenerateArguments()
        {
            Argument[] arguments = new Argument[_swarmSize];
            for (int i = 0; i < _swarmSize; i++)
            {
                arguments[i] = new Argument { Values = new double[_dimensions] };
                for (int j = 0; j < _dimensions; j++)
                {
                    arguments[i].Values[j] = _minValue + (_random.NextDouble() * (_maxValue - _minValue));
                }
            }
            return arguments;
        }

        private void SaveCurrentState(int iteration, List<Particle> swarm)
        {
            var state = new AlgorithmStatePSO
            {
                Parameters = GetCurrentParameters(),
                CurrentIteration = iteration,
                EvaluationsCount = NumberOfEvaluationFitnessFunction,
                FBest = this.FBest,
                GlobalBestPosition = this.XBest?.Values,
                Particles = swarm.Select(p => new ParticleState
                {
                    Position = p.Position,
                    Velocity = p.Velocity,
                    BestPosition = p.BestPosition,
                    BestFitness = p.BestFitness
                }).ToList()
            };

            string json = JsonSerializer.Serialize(state, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(StateFileName, json);
        }

        private AlgorithmStatePSO LoadState()
        {
            string json = File.ReadAllText(StateFileName);
            return JsonSerializer.Deserialize<AlgorithmStatePSO>(json);
        }

        private bool ValidateParameters(AlgorithmStatePSO state)
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
            { "swarmSize", _swarmSize }, { "iterations", _iterations },
            { "dimensions", _dimensions }, { "minValue", _minValue }, { "maxValue", _maxValue },
            { "w", _w }, { "c1", _c1 }, { "c2", _c2 }
        };
        }
        private class AlgorithmStatePSO
        {
            public Dictionary<string, double> Parameters { get; set; }
            public int CurrentIteration { get; set; }
            public int EvaluationsCount { get; set; }
            public double FBest { get; set; }
            public double[] GlobalBestPosition { get; set; }
            public List<ParticleState> Particles { get; set; }
        }
    }
}
