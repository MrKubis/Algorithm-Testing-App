using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlgorithmTester.Infractructure;
{
    public class FunctionProvider
    {
        public static double RastraginFunction(double[] X)
        {
            double A = 10.0;
            double sum = 0;
            for (int i = 0; i < X.Length; i++)
            {
                sum += X[i] * X[i] - (A * Math.Cos(2 * Math.PI * X[i]));
            }
            sum += A * X.Length;
            return sum;
        }
        public static double RosenbrockFunction(double[] X)
        {
            double sum = 0;
            for (int i = 0; i < X.Length - 1; i++)
            {
                sum += 100 * Math.Pow(X[i + 1] - Math.Pow(X[i], 2), 2) + Math.Pow(1 - X[i], 2);
            }
            return sum;
        }
        public static double SphereFunction(double[] X)
        {
            double sum = 0.0;
            for (int i = 0; i < X.Length; i++)
            {
                sum += X[i] * X[i];
            }
            return sum;
        }
        public static double BealeFunction(double[] X)
        {
            // Beale Function is only 2-dimensional
            return (Math.Pow(1.5 - X[0] + X[0] * X[1], 2)
                    + Math.Pow(2.25 - X[0] + X[0] * X[1] * X[1], 2)
                    + Math.Pow(2.625 - X[0] + X[0] * X[1] * X[1] * X[1], 2));
        }

        public static double BukinFunction(double[] X)
        {
            // Bukin Function is only 2-dimensional
            return (100 * Math.Sqrt(Math.Abs(X[1] - 0.01 * Math.Pow(X[0], 2))) + 0.01 * Math.Abs(X[0] + 10));
        }
    }
}
