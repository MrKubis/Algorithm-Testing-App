using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.requests
{
    public class AlgorithmCommand
    {
        public string RequestedState { get; set; }
    }

    //To później
    public enum State
    {
        START,STOP
    }
}

