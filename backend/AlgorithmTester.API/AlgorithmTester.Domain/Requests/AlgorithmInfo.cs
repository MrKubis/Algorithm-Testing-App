using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.Requests
{
    public class AlgorithmInfo
    {
        public string AlgorithmName { get; set; }
        public Dictionary<string, double> ParamValues { get; set; }
    }
}
