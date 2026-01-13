using iTextSharp.text;
using iTextSharp.text.pdf;
using System.Globalization;
using AlgorithmTester.Domain;
using AlgorithmTester.Domain.Requests;
using System.Linq;

namespace AlgorithmTester.Infrastructure.Reports
{
    public class PdfReportGenerator
    {
        private const string FontName = BaseFont.HELVETICA;
        private const int TitleFontSize = 24;
        private const int SectionFontSize = 14;
        private const int SubsectionFontSize = 12;
        private const int BodyFontSize = 10;

        public byte[] GenerateAlgorithmPdf(AlgorithmReport report)
        {
            using (var memoryStream = new System.IO.MemoryStream())
            {
                var document = new Document(PageSize.A4, 40, 40, 50, 50);
                var writer = PdfWriter.GetInstance(document, memoryStream);
                
                document.Open();

                // Title
                AddTitle(document, $"Algorithm Report: {report.AlgorithmInfo.AlgorithmName}");

                // Summary Section
                AddAlgorithmSummary(document, report);

                // Generation Details
                AddGenerationDetails(document, report);

                // Final Results
                AddFinalResults(document, report);

                document.Close();
                return memoryStream.ToArray();
            }
        }

        public byte[] GenerateFunctionPdf(FunctionReport report)
        {
            using (var memoryStream = new System.IO.MemoryStream())
            {
                var document = new Document(PageSize.A4, 40, 40, 50, 50);
                var writer = PdfWriter.GetInstance(document, memoryStream);
                
                document.Open();

                // Title
                AddTitle(document, $"Function Testing Report: {report.FunctionInfo.FunctionName}");

                // Function Info
                AddFunctionInfo(document, report.FunctionInfo);

                // Algorithm Results
                AddAlgorithmResults(document, report);

                document.Close();
                return memoryStream.ToArray();
            }
        }

        private void AddTitle(Document document, string title)
        {
            var titleFont = new Font(FontFactory.GetFont(FontName, TitleFontSize, Font.BOLD));
            var titlePara = new Paragraph(title, titleFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 20
            };
            document.Add(titlePara);

            // Add timestamp
            var timestampFont = new Font(FontFactory.GetFont(FontName, BodyFontSize));
            var timestamp = new Paragraph($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss}", timestampFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 20
            };
            document.Add(timestamp);

            // Add line separator
            document.Add(new Paragraph(" "));
        }

        private void AddAlgorithmSummary(Document document, AlgorithmReport report)
        {
            var sectionFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
            var section = new Paragraph("Summary", sectionFont) { SpacingBefore = 15, SpacingAfter = 10 };
            document.Add(section);

            var bodyFont = new Font(FontFactory.GetFont(FontName, BodyFontSize));

            // Create summary table
            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 30, 70 });

            AddTableRow(table, "Algorithm:", report.AlgorithmInfo.AlgorithmName, true);
            AddTableRow(table, "Total Generations:", report.StepsCount.ToString(), true);

            if (report.Evaluations.Count > 0)
            {
                var bestFitness = report.Evaluations[0].FBest;
                AddTableRow(table, "Best Fitness Value:", string.Format("{0:E6}", bestFitness), true);
                AddTableRow(table, "Function(s) Tested:", string.Join(", ", report.Evaluations.Select(e => e.Function)), true);
            }

            document.Add(table);
            document.Add(new Paragraph(" "));
        }

        private void AddGenerationDetails(Document document, AlgorithmReport report)
        {
            var sectionFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
            var section = new Paragraph("Algorithm Parameters", sectionFont) { SpacingBefore = 15, SpacingAfter = 10 };
            document.Add(section);

            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 30, 70 });

            if (report.AlgorithmInfo.ParamValues != null)
            {
                foreach (var param in report.AlgorithmInfo.ParamValues)
                {
                    AddTableRow(table, param.Key, param.Value.ToString(), true);
                }
            }

            document.Add(table);
            document.Add(new Paragraph(" "));

            // Generation-by-generation progress
            var genSectionFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
            var genSection = new Paragraph("Generation Progress", genSectionFont) { SpacingBefore = 15, SpacingAfter = 10 };
            document.Add(genSection);

            if (report.Evaluations.Count > 0)
            {
                var evaluation = report.Evaluations[0];
                var genTable = new PdfPTable(3) { WidthPercentage = 100 };
                genTable.SetWidths(new float[] { 25, 35, 40 });

                // Headers
                AddTableHeaderCell(genTable, "Generation");
                AddTableHeaderCell(genTable, "Best Fitness");
                AddTableHeaderCell(genTable, "Solution (X)");

                // Show every generation for short runs, otherwise every 5 generations
                int displayInterval = report.StepsCount <= 50 ? 1 : 5;

                foreach (var gen in evaluation.Generations.Where(g => g.Generation % displayInterval == 0 || g.Generation == evaluation.Step))
                {
                    var bodyFont = new Font(FontFactory.GetFont(FontName, BodyFontSize - 1));
                    genTable.AddCell(new PdfPCell(new Phrase(gen.Generation.ToString(), bodyFont)) { Padding = 5 });
                    genTable.AddCell(new PdfPCell(new Phrase(string.Format("{0:E4}", gen.FBest ?? evaluation.FBest), bodyFont)) { Padding = 5 });

                    string solutionStr = gen.XBest != null && gen.XBest.Values.Length > 0
                        ? string.Join(", ", gen.XBest.Values.Take(3).Select(v => v.ToString("F3"))) +
                          (gen.XBest.Values.Length > 3 ? "..." : "")
                        : "N/A";
                    genTable.AddCell(new PdfPCell(new Phrase(solutionStr, bodyFont)) { Padding = 5 });
                }

                document.Add(genTable);
                document.Add(new Paragraph(" "));
            }
        }

        private void AddFinalResults(Document document, AlgorithmReport report)
        {
            var sectionFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
            var section = new Paragraph("Final Results", sectionFont) { SpacingBefore = 15, SpacingAfter = 10 };
            document.Add(section);

            if (report.Evaluations.Count > 0)
            {
                var evaluation = report.Evaluations[0];
                var table = new PdfPTable(2) { WidthPercentage = 100 };
                table.SetWidths(new float[] { 30, 70 });

                AddTableRow(table, "Function:", evaluation.Function, true);
                AddTableRow(table, "Final Best Fitness:", string.Format("{0:E6}", evaluation.FBest), true);
                AddTableRow(table, "Total Evaluations:", evaluation.Step.ToString(), true);

                if (evaluation.XBest != null && evaluation.XBest.Values.Length > 0)
                {
                    var solutionStr = string.Join(", ", evaluation.XBest.Values.Select(v => v.ToString("F6")));
                    AddTableRow(table, "Best Solution:", solutionStr, true);
                }

                document.Add(table);
            }
        }

        private void AddFunctionInfo(Document document, FunctionInfo functionInfo)
        {
            var sectionFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
            var section = new Paragraph("Function Information", sectionFont) { SpacingBefore = 15, SpacingAfter = 10 };
            document.Add(section);

            var table = new PdfPTable(2) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 30, 70 });

            AddTableRow(table, "Function Name:", functionInfo.FunctionName, true);
            AddTableRow(table, "Domain Min:", string.Format("{0:F4}", functionInfo.minValue), true);
            AddTableRow(table, "Domain Max:", string.Format("{0:F4}", functionInfo.maxValue), true);

            document.Add(table);
            document.Add(new Paragraph(" "));
        }

        private void AddAlgorithmResults(Document document, FunctionReport report)
        {
            foreach (var evaluation in report.Evaluations)
            {
                var subsectionFont = new Font(FontFactory.GetFont(FontName, SubsectionFontSize, Font.BOLD));
                var subsection = new Paragraph(evaluation.AlgorithmName, subsectionFont) { SpacingBefore = 15, SpacingAfter = 10 };
                document.Add(subsection);

                var table = new PdfPTable(2) { WidthPercentage = 100 };
                table.SetWidths(new float[] { 30, 70 });

                AddTableRow(table, "Best Fitness:", string.Format("{0:E6}", evaluation.FBest), true);
                AddTableRow(table, "Total Generations:", evaluation.Step.ToString(), true);

                if (evaluation.ParamValues != null && evaluation.ParamValues.Any())
                {
                    foreach (var param in evaluation.ParamValues)
                    {
                        AddTableRow(table, param.Key + ":", param.Value.ToString(), true);
                    }
                }

                if (evaluation.XBest != null && evaluation.XBest.Values.Length > 0)
                {
                    var solutionStr = string.Join(", ", evaluation.XBest.Values.Select(v => string.Format("{0:F6}", v)));
                    AddTableRow(table, "Best Solution:", solutionStr, true);
                }

                document.Add(table);
                document.Add(new Paragraph(" "));

                // Generation progress for each algorithm in function testing
                if (evaluation.Generations.Any())
                {
                    var genSectionFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
                    var genSection = new Paragraph("Generation Progress", genSectionFont) { SpacingBefore = 5, SpacingAfter = 8 };
                    document.Add(genSection);

                    var genTable = new PdfPTable(3) { WidthPercentage = 100 };
                    genTable.SetWidths(new float[] { 25, 35, 40 });
                    AddTableHeaderCell(genTable, "Generation");
                    AddTableHeaderCell(genTable, "Best Fitness");
                    AddTableHeaderCell(genTable, "Solution (X)");

                    int displayInterval = report.StepsCount <= 50 ? 1 : 5;
                    foreach (var gen in evaluation.Generations.Where(g => g.Generation % displayInterval == 0 || g.Generation == evaluation.Step))
                    {
                        var bodyFont = new Font(FontFactory.GetFont(FontName, BodyFontSize - 1));
                        genTable.AddCell(new PdfPCell(new Phrase(gen.Generation.ToString(), bodyFont)) { Padding = 5 });
                        genTable.AddCell(new PdfPCell(new Phrase(string.Format("{0:E4}", gen.FBest ?? evaluation.FBest), bodyFont)) { Padding = 5 });

                        string solutionStr = gen.XBest != null && gen.XBest.Values.Length > 0
                            ? string.Join(", ", gen.XBest.Values.Take(3).Select(v => v.ToString("F3"))) +
                              (gen.XBest.Values.Length > 3 ? "..." : "")
                            : "N/A";
                        genTable.AddCell(new PdfPCell(new Phrase(solutionStr, bodyFont)) { Padding = 5 });
                    }

                    document.Add(genTable);
                    document.Add(new Paragraph(" "));
                }
            }

            // Summary comparison
            if (report.Evaluations.Count > 1)
            {
                var comparisonFont = new Font(FontFactory.GetFont(FontName, SectionFontSize, Font.BOLD));
                var comparison = new Paragraph("Algorithm Comparison", comparisonFont) { SpacingBefore = 15, SpacingAfter = 10 };
                document.Add(comparison);

                var compTable = new PdfPTable(3) { WidthPercentage = 100 };
                compTable.SetWidths(new float[] { 30, 35, 35 });

                AddTableHeaderCell(compTable, "Algorithm");
                AddTableHeaderCell(compTable, "Best Fitness");
                AddTableHeaderCell(compTable, "Generations");

                var sortedByFitness = report.Evaluations.OrderBy(e => e.FBest).ToList();
                foreach (var eval in sortedByFitness)
                {
                    var bodyFont = new Font(FontFactory.GetFont(FontName, BodyFontSize));
                    compTable.AddCell(new PdfPCell(new Phrase(eval.AlgorithmName, bodyFont)) { Padding = 5 });
                    compTable.AddCell(new PdfPCell(new Phrase(string.Format("{0:E6}", eval.FBest), bodyFont)) { Padding = 5 });
                    compTable.AddCell(new PdfPCell(new Phrase(eval.Step.ToString(), bodyFont)) { Padding = 5 });
                }

                document.Add(compTable);
            }
        }

        private void AddTableRow(PdfPTable table, string label, string value, bool isHeader = false)
        {
            var font = isHeader 
                ? new Font(FontFactory.GetFont(FontName, BodyFontSize, Font.BOLD))
                : new Font(FontFactory.GetFont(FontName, BodyFontSize));

            var labelCell = new PdfPCell(new Phrase(label, font))
            {
                Padding = 5,
                BackgroundColor = isHeader ? new BaseColor(220, 220, 220) : BaseColor.WHITE
            };

            var valueCell = new PdfPCell(new Phrase(value, font))
            {
                Padding = 5,
                BackgroundColor = isHeader ? new BaseColor(220, 220, 220) : BaseColor.WHITE
            };

            table.AddCell(labelCell);
            table.AddCell(valueCell);
        }

        private void AddTableHeaderCell(PdfPTable table, string text)
        {
            var font = new Font(FontFactory.GetFont(FontName, BodyFontSize, Font.BOLD, BaseColor.WHITE));
            var cell = new PdfPCell(new Phrase(text, font))
            {
                Padding = 5,
                BackgroundColor = new BaseColor(100, 100, 100)
            };
            table.AddCell(cell);
        }
    }
}
