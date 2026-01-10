namespace AlgorithmTester.Infrastructure.Algorithms.Genetic_Algorithm
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
