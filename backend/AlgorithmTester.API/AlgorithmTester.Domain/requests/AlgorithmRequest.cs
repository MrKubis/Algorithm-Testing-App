using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.requests
{
    public class AlgorithmRequest
    {
        public string AlgorithmName { get; set; }
        public Dictionary<string, double> ParamValues { get; set; }
        public double[] Arguments;
        public int Step { get; set; }
        public int Steps {get; set;}
        public string[] FunctionList { get; set; }
    }
}
