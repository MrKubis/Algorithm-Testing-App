using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain
{
    public interface IStateReader
    {
        void LoadFromFileStateOfAlgorithm(string path);
    }
}
