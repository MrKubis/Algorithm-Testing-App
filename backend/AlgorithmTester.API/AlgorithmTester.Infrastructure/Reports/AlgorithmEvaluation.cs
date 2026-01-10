using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Domain;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class AlgorithmEvaluation
    {
        public int Step { get; set; }
        public string? AlgortihmName { get; set; }
        public List<Argument> XFinal { get; set; }
        public Argument? XBest { get; set; }
        public double? FBest { get; set; }
    }
}
