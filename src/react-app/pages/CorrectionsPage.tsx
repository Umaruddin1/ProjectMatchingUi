import { useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/layout/Layout";
import { Button } from "@/react-app/components/ui/button";
import { useWorkflow } from "@/react-app/lib/workflowContext";
import { AlertCircle, CheckCircle2, ArrowRight, Trash2 } from "lucide-react";
import { reconcileMatches } from "@/react-app/lib/api";

export default function CorrectionsPage() {
  const navigate = useNavigate();
  const {
    processData,
    approvedMatches,
    setApprovedMatches,
    setReconcileData,
    setReconcileError,
    setIsReconciling,
  } = useWorkflow();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleApproveAll = () => {
    const allMatches = [
      ...(processData.exact_matches || []),
      ...(processData.suggested_matches || []),
    ];
    setApprovedMatches(allMatches);
  };

  const handleRemoveMatch = (index: number) => {
    setApprovedMatches(approvedMatches.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (approvedMatches.length === 0) {
      setError("Please approve at least one match");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setIsReconciling(true);

    try {
      const result = await reconcileMatches({
        approved_matches: approvedMatches,
        current_year_rows: processData.current_year_rows,
        previous_year_rows: processData.previous_year_rows,
      });

      if (result.success) {
        setReconcileData(result);
        setReconcileError(null);
        navigate("/results");
      } else {
        setError(result.error || "Failed to reconcile matches");
        setReconcileError(result.error || "Failed to reconcile matches");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setReconcileError(errorMsg);
    } finally {
      setIsSubmitting(false);
      setIsReconciling(false);
    }
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
            Approve Matches
          </h2>
          <p className="text-muted-foreground">
            Review and approve project matches before reconciliation
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Exact Matches
            </p>
            <p className="text-2xl font-semibold text-success">
              {processData.exact_matches?.length || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Suggested
            </p>
            <p className="text-2xl font-semibold text-accent">
              {processData.suggested_matches?.length || 0}
            </p>
          </div>
          <div className="bg-card border border-success/30 rounded-lg p-4">
            <p className="text-xs text-success uppercase tracking-wide mb-1">
              Approved
            </p>
            <p className="text-2xl font-semibold text-success">
              {approvedMatches.length}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Approved Matches List */}
        {approvedMatches.length > 0 && (
          <div className="mb-8 bg-card border border-success/30 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-success/5">
              <h3 className="text-lg font-semibold text-foreground">
                ✓ Approved Matches ({approvedMatches.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-left font-medium">Project</th>
                    <th className="px-6 py-3 text-right font-medium">Current Row</th>
                    <th className="px-6 py-3 text-right font-medium">Previous Row</th>
                    <th className="px-6 py-3 text-right font-medium">Type</th>
                    <th className="px-6 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedMatches.map((match: any, idx: number) => (
                    <tr key={idx} className="border-t border-border hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{match.project_name}</td>
                      <td className="px-6 py-3 text-right">{match.current_row_number}</td>
                      <td className="px-6 py-3 text-right">{match.previous_row_number || "-"}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          match.fuzzy_match_score ? "bg-accent/20 text-accent" : "bg-success/20 text-success"
                        }`}>
                          {match.fuzzy_match_score ? `Fuzzy (${match.fuzzy_match_score.toFixed(1)}%)` : "Exact"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMatch(idx)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Available Matches to Approve */}
        <div className="mb-8 bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Available Matches ({((processData.exact_matches?.length || 0) + (processData.suggested_matches?.length || 0)) - approvedMatches.length})
            </h3>
            {approvedMatches.length === 0 && (
              <Button
                onClick={handleApproveAll}
                variant="outline"
                size="sm"
              >
                Approve All
              </Button>
            )}
          </div>

          {((processData.exact_matches?.length || 0) + (processData.suggested_matches?.length || 0)) - approvedMatches.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">All matches approved!</p>
              <p className="text-sm text-muted-foreground">Ready to reconcile</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Exact Matches */}
              {processData.exact_matches
                ?.filter((m: any) => !approvedMatches.find((a: any) => a.current_row_number === m.current_row_number))
                .map((match: any, idx: number) => (
                  <div key={`exact-${idx}`} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{match.project_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Row {match.current_row_number} → Row {match.previous_row_number} (Exact match)
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                          <div className="bg-muted p-2 rounded">
                            <p className="text-muted-foreground">Current: {formatNumber(match.current_values?.closing_balance || match.current_values?.as_on_31_mar)}</p>
                          </div>
                          <div className="bg-muted p-2 rounded">
                            <p className="text-muted-foreground">Previous: {formatNumber(match.previous_values?.closing_balance)}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setApprovedMatches([...approvedMatches, match])}
                        size="sm"
                        className="ml-4"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}

              {/* Suggested Matches */}
              {processData.suggested_matches
                ?.filter((m: any) => !approvedMatches.find((a: any) => a.current_row_number === m.current_row_number))
                .map((match: any, idx: number) => (
                  <div key={`suggested-${idx}`} className="px-6 py-4 hover:bg-muted/50 transition-colors bg-accent/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{match.project_name}</p>
                          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded font-medium">
                            {match.fuzzy_match_score?.toFixed(1) || 0}% match
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Row {match.current_row_number} → Row {match.previous_row_number} (Suggested match)
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                          <div className="bg-muted p-2 rounded">
                            <p className="text-muted-foreground">Current: {formatNumber(match.current_values?.closing_balance || match.current_values?.as_on_31_mar)}</p>
                          </div>
                          <div className="bg-muted p-2 rounded">
                            <p className="text-muted-foreground">Previous: {formatNumber(match.previous_values?.closing_balance)}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setApprovedMatches([...approvedMatches, match])}
                        size="sm"
                        variant="outline"
                        className="ml-4"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button
            onClick={() => navigate("/preview")}
            variant="outline"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={approvedMatches.length === 0 || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⚙️</span> Reconciling...
              </>
            ) : (
              <>
                Proceed to Results
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
