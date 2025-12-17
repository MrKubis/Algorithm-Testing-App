using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlgorithmTester;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Domain.Validators;

namespace AlgorithmTester.Infrastructure.Algorithms
{
    public class AlgorithmHandler
    {
        public static async Task RunAlgorithmAsync(
            AlgorithmRequest request,
            CancellationToken cancellationToken      
            )
        {

            // Dostaje request
            // Sprawdza jaki algorytm
            // Sprawdza parametry
            // Sprawdza krok

            // Robi pętle ile jest generacji ( Steps - Step ) 

            if(request.Steps == null) { throw new Exception("Steps not defined"); }

            //Jeżeli uruchamiamy już wcześniej zaczęty algorytm
            if(request.Step != null && request.Step > 0)
            {
                if (request.Step > request.Steps) throw new Exception("Starting step is bigger than steps");
            }

            while (!cancellationToken.IsCancellationRequested)
            {

                // Algorithm State

                // i = step / 0
                // state = null
                // While i < Steps
                // Solve(state) -> State
                // state = State

                // Handler wysyła AlgorithmState końcowy

            }
            if (cancellationToken.IsCancellationRequested)
            {

            }
        }
    }
}
