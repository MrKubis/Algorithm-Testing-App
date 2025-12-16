using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace gen_algo
{
    public class IndividualState
    {
        public required double[] Genes { get; set; }
        public double Fitness { get; set; }
    }
}
