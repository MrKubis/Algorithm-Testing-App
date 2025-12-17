using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.Requests
{
    public class AlgorithmRequest
    {
        [Required]
        public string AlgorithmName { get; set; }
        [Required]
        public List<ParamRequest> ParamRequestList { get; set; }
        [Required]
        public int Steps { get; set; }
        public int? Step {get; set;}
        public double[]? X { get; set; }
        [Required]
        public string[] FunctionList { get; set; }
    }
}
