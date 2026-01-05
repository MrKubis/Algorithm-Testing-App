using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Infrastructure
{
    public class Individual
    {
        public double[] Genes { get; set; }
        public double Fitness { get; set; }

        public Individual(int geneCount)
        {
            Genes = new double[geneCount];
        }

        public Individual Clone()
        {
            var clone = new Individual(Genes.Length);
            Array.Copy(Genes, clone.Genes, Genes.Length);
            clone.Fitness = Fitness;
            return clone;
        }
    }
}
