using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain
{
    public class ParamInfo
    {
        string Name {  get; set; }
        string Description { get; set; }
        double UpperBoundary { get; set; }
        double LowerBoundary { get; set; }
    }
}
