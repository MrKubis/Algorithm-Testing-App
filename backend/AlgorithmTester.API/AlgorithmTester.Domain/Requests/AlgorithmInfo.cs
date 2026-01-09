using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.Requests
{
    public class AlgorithmInfo
    {
        public Dictionary<string, double> ParamValues { get; set; }
        public string AlgorithmName { get; set; }
    }
}
