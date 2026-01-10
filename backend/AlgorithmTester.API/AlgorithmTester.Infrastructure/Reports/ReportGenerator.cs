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
                AlgorithmInfo = new AlgorithmInfo
                {
                    AlgorithmName = algorithmRequest.AlgorithmName,
                    ParamValues = algorithmRequest.ParamValues
                },
                StepsCount = algorithmRequest.Steps,
                Evaluations = new List<FunctionEvaluation>()
            };
        }

        public void CreateNewFunctionReport(FunctionRequest functionRequest)
        {
            _algorithmReport = null;
            _functionReport = new FunctionReport
            {
                FunctionInfo = new FunctionInfo
                {
                    FunctionName = functionRequest.FunctionName,
                    minValue = functionRequest.minValue,
                    maxValue = functionRequest.maxValue,
                },
                StepsCount = functionRequest.Steps,
                Evaluations = new List<AlgorithmEvaluation>()
            };

        }
        public void CreateEvaluation(string name,double minValue, double maxValue)
        {
            if (_algorithmReport != null && _functionReport != null)
            {
                throw new InvalidOperationException("Cannot add evaluation to 2 reports");
            }
            if (_algorithmReport != null)
            {
                _algorithmReport.Evaluations.Add(new FunctionEvaluation
                {
                    Function = name,
                    minValue = minValue,
                    maxValue = maxValue,
                    Step = 0
                });
            }
            else if (_functionReport != null)
            {
                _functionReport.Evaluations.Add(new AlgorithmEvaluation
                {
                    AlgortihmName = name
                });
            }
            else
            {
                throw new Exception("No report created");
            }
        }

        public void Evaluate(int i ,List<Argument> XFinal, Argument XBest, double FBest)
        {
            if (_algorithmReport != null && _functionReport != null)
            {
                throw new InvalidOperationException("Cannot add evaluation to 2 reports");
            }
            if (_algorithmReport!= null)
            {
                _algorithmReport.Evaluations[i].XBest = XBest;
                _algorithmReport.Evaluations[i].FBest = FBest;
                _algorithmReport.Evaluations[i].XFinal = XFinal;
                _algorithmReport.Evaluations[i].Step += 1;

            }
            else if (_functionReport != null)
            {
                _functionReport.Evaluations[i].XBest = XBest;
                _functionReport.Evaluations[i].FBest = FBest;
                _functionReport.Evaluations[i].XFinal = XFinal;
                _functionReport.Evaluations[i].Step += 1;
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
