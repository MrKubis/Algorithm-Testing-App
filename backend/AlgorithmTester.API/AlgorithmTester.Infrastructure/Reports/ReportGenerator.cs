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
        public void CreateEvaluation(string name,double minValue, double maxValue, Dictionary<string,double>? paramValues = null)
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
                    Step = 0,
                    XFinal = new List<Argument>()
                });
            }
            else if (_functionReport != null)
            {
                _functionReport.Evaluations.Add(new AlgorithmEvaluation
                {
                    AlgorithmName = name,
                    Step = 0,
                    XFinal = new List<Argument>(),
                    ParamValues = paramValues
                });
            }
            else
            {
                throw new Exception("No report created");
            }
        }

        public void Evaluate(int i ,List<Argument> XFinal, Argument XBest, double FBest, int generation)
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
                _algorithmReport.Evaluations[i].Step = generation;
                _algorithmReport.Evaluations[i].Generations.Add(new GenerationRecord
                {
                    Generation = generation,
                    FBest = FBest,
                    XBest = XBest
                });

            }
            else if (_functionReport != null)
            {
                _functionReport.Evaluations[i].XBest = XBest;
                _functionReport.Evaluations[i].FBest = FBest;
                _functionReport.Evaluations[i].XFinal = XFinal;
                _functionReport.Evaluations[i].Step = generation;
                _functionReport.Evaluations[i].Generations.Add(new GenerationRecord
                {
                    Generation = generation,
                    FBest = FBest,
                    XBest = XBest
                });
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

        public byte[] ConvertReportToPDF()
        {
            var pdfGenerator = new PdfReportGenerator();
            
            if (_algorithmReport != null && _functionReport != null)
            {
                throw new InvalidOperationException("Cannot have 2 reports");
            }
            if (_algorithmReport != null)
            {
                return pdfGenerator.GenerateAlgorithmPdf(_algorithmReport);
            }
            else if (_functionReport != null)
            {
                return pdfGenerator.GenerateFunctionPdf(_functionReport);
            }
            else
            {
                throw new Exception("No report found");
            }
        }
    }
}
