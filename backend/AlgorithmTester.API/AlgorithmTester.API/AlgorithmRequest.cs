using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.API
{
    public class AlgorithmRequest
    {
        public string AlgorithmName { get; set; }
        public List<ParamRequest> ParamRequestList { get; set; }
        public int Steps { get; set; }
        public string[] FunctionList { get; set; }
    }
}
