using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Domain;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class FunctionEvaluation
    {
        public int Step { get; set; }
        public string? Function {  get; set; }
        public double minValue {get; set; }
        public double maxValue {get; set; }
        public List<Argument> XFinal { get; set; }
        public Argument? XBest {  get; set; }
        public double? FBest { get; set; }
    }
}
