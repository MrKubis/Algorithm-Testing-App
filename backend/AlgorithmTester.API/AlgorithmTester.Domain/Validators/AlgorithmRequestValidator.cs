using AlgorithmTester.Domain.Requests;

namespace AlgorithmTester.Domain.Validators
{
    public static class AlgorithmRequestValidator
    {
        public static bool Validate(AlgorithmRequest request)
        {
            if (request.Steps < 1) throw new Exception("Steps ammount must be bigger than 0");
            if (request.Step != 0)
            {
                if (request.Step < 1) throw new Exception("Step must be bigger than 0");
                if (request.Step > request.Steps) throw new Exception("Step must be smaller than Steps ammount");
                if (request.Arguments == null) throw new Exception("Arguments list not defined");          
            }
            else
            {
                request.Step = 0;
            }

                //TODO sprawdzanie czy X mieści się w przedziałach

                return true;
        }
    }
}
