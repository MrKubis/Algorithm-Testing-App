using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.Requests
{
    public class Request
    {
        public string Type { get; set; }
        public JsonElement Body { get ; set; }
    }
}
