using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace AlgorithmTester.Domain
{
    public delegate double fitnessFunction(params double[] arg);
    public interface IOptimizationAlgorithm
    {
        string Name { get; set; }
        static void Solve(fitnessFunction f, double[] domain, params double[] parameters) { }
        ParamInfo[] ParamsInfo { get; set; }
        IStateWriter writer {  get; set; }
        IStateReader reader { get; set; }
        IGenerateTextReport stringReportGenerator { get; set; }
        IGeneratePDFReport pdfReportGenerator { get; set; }
        double[] XBest { get; set; }
        double FBest { get; set; }
        int NumberOfEvaluationFitnessFunction { get; set; }
    }
}
