using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Infrastructure.Algorithms.Particle_Swarm_Optimization
{
    public class Particle
    {
        public double[] Position { get; set; }
        public double[] Velocity { get; set; }
        public double[] BestPosition { get; set; }
        public double BestFitness { get; set; }
        public double CurrentFitness { get; set; }

        public Particle(int dimensions)
        {
            Position = new double[dimensions];
            Velocity = new double[dimensions];
            BestPosition = new double[dimensions];
            BestFitness = double.MaxValue;
            CurrentFitness = double.MaxValue;
        }

        public Particle Clone()
        {
            var clone = new Particle(Position.Length);
            Array.Copy(Position, clone.Position, Position.Length);
            Array.Copy(Velocity, clone.Velocity, Velocity.Length);
            Array.Copy(BestPosition, clone.BestPosition, BestPosition.Length);
            clone.BestFitness = BestFitness;
            clone.CurrentFitness = CurrentFitness;
            return clone;
        }
    }
}
