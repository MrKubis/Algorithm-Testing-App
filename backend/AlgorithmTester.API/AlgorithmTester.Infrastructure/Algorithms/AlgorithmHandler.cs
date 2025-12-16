using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester.Domain.requests;

namespace AlgorithmTester.Infrastructure.Algorithms
{
    public class AlgorithmHandler
    {
        public static async Task RunAlgorithmAsync(
            AlgorithmRequest request,
            CancellationToken cancellationToken)
        {
            Console.WriteLine("Performing algorithm: "+request.AlgorithmName);
        }
    }
}
