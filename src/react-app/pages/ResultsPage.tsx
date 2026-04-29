import { useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/layout/Layout";
import { Button } from "@/react-app/components/ui/button";
import { useWorkflow } from "@/react-app/lib/workflowContext";
import { AlertCircle, Download, ChevronUp, ChevronDown, Home } from "lucide-react";
import { exportToExcel, downloadFile } from "@/react-app/lib/api";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { reconcileData, processData, resetWorkflow } = useWorkflow();
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    matches: true,
    unmatched: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reconcileData || !processData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Results Available
          </h2>
          <p className="text-muted-foreground mb-6">
            Please complete the reconciliation process first
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
    if (typeof val === "number") {
      const formatted = val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return val < 0 ? `(${formatted})` : formatted;
    }
    return val;
  };

  const handleExport = async () => {
    setError(null);
    setIsExporting(true);

    try {
      const exportPayload = {
        reconciled_matches: reconcileData.reconciled_matches || [],
        unmatched_current_rows: reconcileData.unmatched_current_rows || [],
        unmatched_previous_rows: reconcileData.unmatched_previous_rows || [],
        validation_issues: processData.validation_issues || [],
        summary: {
          total_matched: reconcileData.total_matched,
          total_wip_impact: reconcileData.total_wip_impact,
          total_far_impact: reconcileData.total_far_impact,
        },
      };

      const blob = await exportToExcel(exportPayload);
      if (blob) {
        downloadFile(blob, `reconciliation_${new Date().getTime()}.xlsx`);
      } else {
        setError("Failed to export file");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const totalWipImpact = reconcileData.total_wip_impact || 0;
  const totalFarImpact = reconcileData.total_far_impact || 0;

  // Compute unmatched counts: prefer included rows length, fall back to totals returned by API when arrays are empty
  const unmatchedCurrentCount = (reconcileData.unmatched_current_rows?.length || 0) || (reconcileData.total_unmatched_current ?? reconcileData.total_unmatched ?? 0);
  const unmatchedPreviousCount = (reconcileData.unmatched_previous_rows?.length || 0) || (reconcileData.total_unmatched_previous ?? reconcileData.total_unmatched ?? 0);
  const unmatchedTotalCount = unmatchedCurrentCount + unmatchedPreviousCount;

  return (
    <Layout fileName="reconciliation_result.xlsx">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Reconciliation Results
          </h2>
          <p className="text-muted-foreground">
            Final reconciliation summary with impacts and download option
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Matched
            </p>
            <p className="text-2xl font-semibold text-success">
              {reconcileData.total_matched || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              WIP Impact
            </p>
            <p className={`text-2xl font-semibold ${totalWipImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatNumber(totalWipImpact)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              FAR Impact
            </p>
            <p className={`text-2xl font-semibold ${totalFarImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatNumber(totalFarImpact)}
            </p>
          </div>
          <div className="bg-card border border-accent/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Unmatched
            </p>
            <p className="text-2xl font-semibold text-foreground">
              {unmatchedTotalCount}
            </p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-6 bg-card border border-success/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("summary")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground">Summary</h3>
            {expandedSections.summary ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.summary && (
            <div className="px-6 py-4 border-t border-border bg-success/5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Matched Rows</p>
                  <p className="text-3xl font-bold text-success">
                    {reconcileData.total_matched || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Unmatched Current</p>
                  <p className="text-3xl font-bold text-accent">
                    {unmatchedCurrentCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Unmatched Previous</p>
                  <p className="text-3xl font-bold text-accent">
                    {unmatchedPreviousCount}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Matched Rows Section */}
        <div className="mb-6 bg-card border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("matches")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Matched Rows ({reconcileData.reconciled_matches?.length || 0})
            </h3>
            {expandedSections.matches ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.matches && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border bg-muted">
                    <th className="px-6 py-3 text-left font-medium">Project</th>
                    <th className="px-6 py-3 text-right font-medium">Current</th>
                    <th className="px-6 py-3 text-right font-medium">Previous</th>
                    <th className="px-6 py-3 text-right font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">WIP Impact</th>
                    <th className="px-6 py-3 text-right font-medium">FAR Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {reconcileData.reconciled_matches?.slice(0, 20).map((match: any, idx: number) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{match.project_name || match.current_project || match.previous_project || "-"}</td>
                      <td className="px-6 py-3 text-right">{match.current_row_number ?? "-"}</td>
                      <td className="px-6 py-3 text-right">{match.previous_row_number ?? "-"}</td>
                      <td className="px-6 py-3 text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            match.match_status === "unmatched_current" || match.match_status === "unmatched_previous"
                              ? "bg-accent/20 text-accent"
                              : "bg-success/20 text-success"
                          }`}
                        >
                          {match.match_status === "unmatched_current"
                            ? "Unmatched current"
                            : match.match_status === "unmatched_previous"
                              ? "Unmatched previous"
                              : match.match_type || "Matched"}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-right font-medium ${(match.wip_impact || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatNumber(match.wip_impact)}
                      </td>
                      <td className={`px-6 py-3 text-right font-medium ${(match.far_impact || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatNumber(match.far_impact)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(reconcileData.reconciled_matches?.length || 0) > 20 && (
                <div className="px-6 py-3 text-xs text-muted-foreground bg-muted">
                  Showing 20 of {reconcileData.reconciled_matches?.length || 0} rows
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unmatched Rows Section */}
        {((reconcileData.unmatched_current_rows?.length || 0) > 0 || (reconcileData.unmatched_previous_rows?.length || 0) > 0) && (
          <div className="mb-6 bg-card border border-accent/30 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("unmatched")}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground">
                Unmatched Rows ({(reconcileData.unmatched_current_rows?.length || 0) + (reconcileData.unmatched_previous_rows?.length || 0)})
              </h3>
              {expandedSections.unmatched ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandedSections.unmatched && (
              <div className="divide-y divide-border">
                {reconcileData.unmatched_current_rows && reconcileData.unmatched_current_rows.length > 0 && (
                  <div className="p-6">
                    <h4 className="font-medium text-accent mb-3">Current Year</h4>
                    <div className="space-y-2">
                      {reconcileData.unmatched_current_rows.slice(0, 10).map((row: any, idx: number) => (
                        <div key={idx} className="text-sm bg-accent/5 p-3 rounded">
                          <p className="text-foreground font-medium">{row.project_name}</p>
                          <p className="text-xs text-muted-foreground">Row {row.row_number}</p>
                        </div>
                      ))}
                      {(reconcileData.unmatched_current_rows.length || 0) > 10 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{(reconcileData.unmatched_current_rows.length || 0) - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {reconcileData.unmatched_previous_rows && reconcileData.unmatched_previous_rows.length > 0 && (
                  <div className="p-6">
                    <h4 className="font-medium text-accent mb-3">Previous Year</h4>
                    <div className="space-y-2">
                      {reconcileData.unmatched_previous_rows.slice(0, 10).map((row: any, idx: number) => (
                        <div key={idx} className="text-sm bg-accent/5 p-3 rounded">
                          <p className="text-foreground font-medium">{row.project_name}</p>
                          <p className="text-xs text-muted-foreground">Row {row.row_number}</p>
                        </div>
                      ))}
                      {(reconcileData.unmatched_previous_rows.length || 0) > 10 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{(reconcileData.unmatched_previous_rows.length || 0) - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export Section */}
        <div className="mb-8 bg-success/5 border border-success/30 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ready to Download
              </h3>
              <p className="text-sm text-muted-foreground">
                Export the reconciliation results as an Excel file with all matched data, impacts, and unmatched rows.
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              size="lg"
              className="whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin">⚙️</span> Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button
            onClick={() => {
              resetWorkflow();
              navigate("/");
            }}
            variant="outline"
          >
            <Home className="w-4 h-4 mr-2" />
            Start New
          </Button>
          <Button
            onClick={() => navigate("/preview")}
            variant="outline"
          >
            Review Details
          </Button>
        </div>
      </div>
    </Layout>
  );
}
