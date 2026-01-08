using System.Text.Json;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Requests;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class ReportGenerator
    {
        private AlgorithmReport? _algorithmReport;
        private FunctionReport? _functionReport;
        public void CreateNewAlgorithmReport(AlgorithmRequest algorithmRequest)
        {
            _functionReport = null;
            _algorithmReport = new AlgorithmReport
            {

                Functions = algorithmRequest.FunctionList,
                Parameters = algorithmRequest.ParamValues,
                Evaluations = new List<Evaluation>()
            };
        }
        public void CreateEvaluation(string Function, List<Argument> XFinal, Argument XBest, double FBest)
        {
            if (_algorithmReport != null && _functionReport != null)
            {
                throw new InvalidOperationException("Cannot add evaluation to 2 reports");
            }
            if (_algorithmReport!= null)
            {
                _algorithmReport.Evaluations.Add(new Evaluation
                {
                    Function = Function,
                    XFinal = XFinal,
                    XBest = XBest,
                    FBest = FBest
                });

            }
            else if (_functionReport != null)
            {

            }
            else
            {
                throw new Exception("No report created");
            }
        }
        public string ConvertReportToString()
        {
            throw new NotImplementedException();

            if (_algorithmReport != null && _functionReport != null)
            {
                throw new InvalidOperationException("Cannot have 2 reports");
            }
            if (_algorithmReport != null)
            {
                string result = "";

              
            }
            else if (_functionReport != null)
            {

            }
            else
            {
                throw new Exception("No report found");
            }
        }
        public string ConvertReportToJSON()
        {
            if (_algorithmReport != null && _functionReport != null)
            {
                throw new InvalidOperationException("Cannot have 2 reports");
            }
            if (_algorithmReport != null)
            {
                return JsonSerializer.Serialize(_algorithmReport);
            }
            else if (_functionReport != null)
            {
                return JsonSerializer.Serialize(_functionReport);
            }
            else
            {
                throw new Exception("No report found");
            }
        }
    }
}
