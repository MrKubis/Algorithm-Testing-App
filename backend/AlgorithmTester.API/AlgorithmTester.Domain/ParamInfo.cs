using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain
{
    public class ParamInfo
    {
        public string Name {  get; set; }
        public string Description { get; set; }
        public double UpperBoundary { get; set; }
        public double LowerBoundary { get; set; }
    }
}
