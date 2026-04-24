import { useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/layout/Layout";
import { Button } from "@/react-app/components/ui/button";
import { useWorkflow } from "@/react-app/lib/workflowContext";
import { AlertCircle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

export default function DataPreviewPage() {
  const navigate = useNavigate();
  const { processData, processError } = useWorkflow();
  const [expandedSections, setExpandedSections] = useState({
    current: true,
    previous: true,
    matches: true,
    issues: false,
  });

  if (!processData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Data Available
          </h2>
          <p className="text-muted-foreground mb-6">
            Please upload and analyze files first
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Upload
          </Button>
        </div>
      </Layout>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatNumber = (val: any) => {
    if (val === null || val === undefined) return "-";
    if (typeof val === "number") return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return val;
  };

  return (
    <Layout fileName="project_data.xlsx">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Data Preview
          </h2>
          <p className="text-muted-foreground">
            Review parsed data from both sheets
          </p>
        </div>

        {/* Error Alert */}
        {processError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{processError}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Current Year
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {processData.summary?.total_current_rows || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Previous Year
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {processData.summary?.total_previous_rows || 0}
            </p>
          </div>
          <div className="bg-card border border-success/30 rounded-lg p-4">
            <p className="text-xs text-success uppercase tracking-wide mb-1">
              Exact Matches
            </p>
            <p className="text-2xl font-semibold text-success">
              {processData.summary?.exact_matches || 0}
            </p>
          </div>
          <div className="bg-card border border-accent/30 rounded-lg p-4">
            <p className="text-xs text-accent uppercase tracking-wide mb-1">
              Suggested
            </p>
            <p className="text-2xl font-semibold text-accent">
              {processData.summary?.suggested_fuzzy_matches || 0}
            </p>
          </div>
        </div>

        {/* Current Year Data */}
        <div className="mb-6 bg-card border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("current")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Current Year Data ({processData.current_year_rows?.length || 0})
            </h3>
            {expandedSections.current ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.current && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border bg-muted">
                    <th className="px-6 py-3 text-left font-medium">Project</th>
                    <th className="px-6 py-3 text-right font-medium">Opening</th>
                    <th className="px-6 py-3 text-right font-medium">Additions</th>
                    <th className="px-6 py-3 text-right font-medium">Transfer</th>
                    <th className="px-6 py-3 text-right font-medium">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {processData.current_year_rows?.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50">
                      <td className="px-6 py-3">{row.project_name}</td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.opening_balance || row.values?.as_of_31_mar)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.additions)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.transfer)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.closing_balance || row.values?.as_on_31_mar)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(processData.current_year_rows?.length || 0) > 10 && (
                <div className="px-6 py-3 text-xs text-muted-foreground bg-muted">
                  Showing 10 of {processData.current_year_rows?.length || 0} rows
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previous Year Data */}
        <div className="mb-6 bg-card border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("previous")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Previous Year Data ({processData.previous_year_rows?.length || 0})
            </h3>
            {expandedSections.previous ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.previous && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border bg-muted">
                    <th className="px-6 py-3 text-left font-medium">Project</th>
                    <th className="px-6 py-3 text-right font-medium">Opening</th>
                    <th className="px-6 py-3 text-right font-medium">Additions</th>
                    <th className="px-6 py-3 text-right font-medium">Transfer</th>
                    <th className="px-6 py-3 text-right font-medium">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {processData.previous_year_rows?.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50">
                      <td className="px-6 py-3">{row.project_name}</td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.opening_balance)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.additions)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.transfer)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {formatNumber(row.values?.closing_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(processData.previous_year_rows?.length || 0) > 10 && (
                <div className="px-6 py-3 text-xs text-muted-foreground bg-muted">
                  Showing 10 of {processData.previous_year_rows?.length || 0} rows
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matches Summary */}
        <div className="mb-6 bg-card border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("matches")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Matches ({(processData.exact_matches?.length || 0) + (processData.suggested_matches?.length || 0)})
            </h3>
            {expandedSections.matches ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.matches && (
            <div className="space-y-4 p-6">
              <div>
                <h4 className="font-medium text-success mb-2">
                  ✓ Exact Matches ({processData.exact_matches?.length || 0})
                </h4>
                <div className="space-y-2">
                  {processData.exact_matches?.slice(0, 5).map((match: any, idx: number) => (
                    <div key={idx} className="text-sm bg-muted p-3 rounded">
                      <p className="text-foreground font-medium">{match.project_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Row {match.current_row_number} ↔ {match.previous_row_number}
                      </p>
                    </div>
                  ))}
                </div>
                {(processData.exact_matches?.length || 0) > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{(processData.exact_matches?.length || 0) - 5} more
                  </p>
                )}
              </div>

              {processData.suggested_matches && processData.suggested_matches.length > 0 && (
                <div>
                  <h4 className="font-medium text-accent mb-2">
                    ⚡ Suggested Matches ({processData.suggested_matches?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {processData.suggested_matches?.slice(0, 5).map((match: any, idx: number) => (
                      <div key={idx} className="text-sm bg-muted p-3 rounded">
                        <p className="text-foreground font-medium">{match.project_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Row {match.current_row_number} ↔ {match.previous_row_number} ({(match.fuzzy_match_score || 0).toFixed(1)}% match)
                        </p>
                      </div>
                    ))}
                  </div>
                  {(processData.suggested_matches?.length || 0) > 5 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{(processData.suggested_matches?.length || 0) - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validation Issues */}
        {processData.validation_issues && processData.validation_issues.length > 0 && (
          <div className="mb-6 bg-card border border-destructive/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("issues")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-destructive">
                Validation Issues ({processData.validation_issues?.length || 0})
              </h3>
              {expandedSections.issues ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandedSections.issues && (
              <div className="divide-y divide-border">
                {processData.validation_issues?.map((issue: any, idx: number) => (
                  <div key={idx} className="px-6 py-3 text-sm bg-destructive/5">
                    <p className="font-medium text-foreground">{issue.project_name}</p>
                    <p className="text-xs text-muted-foreground">{issue.sheet} - Row {issue.row_number}</p>
                    <p className="text-sm text-destructive">{issue.issue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
          >
            Back
          </Button>
          <Button
            onClick={() => navigate("/corrections")}
            size="lg"
          >
            Review & Approve Matches
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
