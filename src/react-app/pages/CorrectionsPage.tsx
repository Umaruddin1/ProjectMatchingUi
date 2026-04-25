import { useEffect, useState } from "react";
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
  const [manualSelections, setManualSelections] = useState<Record<number, string>>({});

  const getSuggestedMatchPercent = (match: any) => {
    const rawScore = match?.fuzzy_match_score ?? match?.confidence ?? 0;
    if (typeof rawScore !== "number" || Number.isNaN(rawScore)) return 0;
    return rawScore <= 1 ? rawScore * 100 : rawScore;
  };

  const normalizeApprovedMatch = (match: any) => {
    const previousRowNumber = match.previous_row_number ?? match.suggested_previous_row_number;
    const projectName = match.project_name ?? match.current_project_name ?? match.suggested_project_name;
    const fuzzyScore = getSuggestedMatchPercent(match);
    const isFuzzy = match.match_type?.includes("fuzzy") || Boolean(match.confidence) || Boolean(match.fuzzy_match_score);

    return {
      ...match,
      project_name: projectName,
      previous_row_number: previousRowNumber,
      fuzzy_match_score: isFuzzy ? fuzzyScore : undefined,
      match_type: match.match_type || (isFuzzy ? "fuzzy" : "exact"),
    };
  };

  useEffect(() => {
    if (!processData) return;

    if (approvedMatches.length === 0) {
      setApprovedMatches((processData.exact_matches || []).map(normalizeApprovedMatch));
    }
    setManualSelections({});
    setError(null);
  }, [processData, approvedMatches.length, setApprovedMatches]);

  if (!processData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Data Available</h2>
          <p className="text-muted-foreground mb-6">Please upload and analyze files first</p>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Upload
          </Button>
        </div>
      </Layout>
    );
  }

  const currentYearRows = processData.current_year_rows || [];
  const previousYearRows = processData.previous_year_rows || [];

  const approvedCurrentRowNumbers = new Set(approvedMatches.map((match: any) => match.current_row_number));
  const approvedPreviousRowNumbers = new Set(
    approvedMatches
      .map((match: any) => match.previous_row_number ?? match.suggested_previous_row_number)
      .filter((value: any) => value !== null && value !== undefined)
  );

  const remainingCurrentRows = currentYearRows.filter((row: any) => !approvedCurrentRowNumbers.has(row.row_number));
  const remainingPreviousRows = previousYearRows.filter((row: any) => !approvedPreviousRowNumbers.has(row.row_number));
  const allCurrentRowsMatched = remainingCurrentRows.length === 0;

  const handleApproveAllFuzzy = () => {
    const nextMatches = [...approvedMatches];

    (processData.suggested_matches || []).forEach((match: any) => {
      if (!nextMatches.some((existing: any) => existing.current_row_number === match.current_row_number)) {
        nextMatches.push(normalizeApprovedMatch(match));
      }
    });

    setApprovedMatches(nextMatches);
  };

  const handleRemoveMatch = (index: number) => {
    const match = approvedMatches[index];
    if (match?.match_type === "exact") return;
    setApprovedMatches(approvedMatches.filter((_, i) => i !== index));
  };

  const handleManualMatch = (currentRow: any) => {
    const selectedPreviousRowNumber = Number(manualSelections[currentRow.row_number]);

    if (!selectedPreviousRowNumber) {
      setError("Please select a previous year project to match");
      return;
    }

    const previousRow = previousYearRows.find((row: any) => row.row_number === selectedPreviousRowNumber);
    if (!previousRow) {
      setError("Selected previous year project could not be found");
      return;
    }

    if (approvedPreviousRowNumbers.has(selectedPreviousRowNumber)) {
      setError("This previous year project is already matched");
      return;
    }

    setApprovedMatches([
      ...approvedMatches,
      normalizeApprovedMatch({
        current_row_number: currentRow.row_number,
        current_project_name: currentRow.project_name,
        suggested_previous_row_number: previousRow.row_number,
        suggested_project_name: previousRow.project_name,
        project_name: currentRow.project_name,
        current_values: currentRow.values,
        previous_values: previousRow.values,
        match_type: "manual",
      }),
    ]);

    setManualSelections((prev) => ({
      ...prev,
      [currentRow.row_number]: "",
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!allCurrentRowsMatched) {
      setError("Please match all current year projects before proceeding");
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
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Approve Matches</h2>
          <p className="text-muted-foreground">
            Exact matches are auto-approved. Approve fuzzy matches or match the remaining current year rows manually.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Auto-approved Exact</p>
            <p className="text-2xl font-semibold text-success">{processData.exact_matches?.length || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fuzzy Suggestions</p>
            <p className="text-2xl font-semibold text-accent">{processData.suggested_matches?.length || 0}</p>
          </div>
          <div className="bg-card border border-success/30 rounded-lg p-4">
            <p className="text-xs text-success uppercase tracking-wide mb-1">Current Matched</p>
            <p className="text-2xl font-semibold text-success">{approvedMatches.length}</p>
          </div>
        </div>

        <div className="mb-6 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-lg font-semibold text-foreground">
                {approvedMatches.length} / {currentYearRows.length} current year rows matched
              </p>
            </div>
            <div className={`text-sm font-medium ${allCurrentRowsMatched ? "text-success" : "text-accent"}`}>
              {allCurrentRowsMatched ? "Ready to proceed" : `${remainingCurrentRows.length} current rows still need manual matching`}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="mb-8 bg-card border border-success/30 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-success/5">
            <h3 className="text-lg font-semibold text-foreground">✓ Approved Matches ({approvedMatches.length})</h3>
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
                    <td className="px-6 py-3 font-medium">{match.project_name || match.current_project_name || "-"}</td>
                    <td className="px-6 py-3 text-right">{match.current_row_number}</td>
                    <td className="px-6 py-3 text-right">{match.previous_row_number || match.suggested_previous_row_number || "-"}</td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          match.match_type === "manual"
                            ? "bg-primary/20 text-primary"
                            : match.fuzzy_match_score
                              ? "bg-accent/20 text-accent"
                              : "bg-success/20 text-success"
                        }`}
                      >
                        {match.match_type === "manual"
                          ? "Manual"
                          : match.fuzzy_match_score
                            ? `Fuzzy (${match.fuzzy_match_score.toFixed(1)}%)`
                            : "Exact"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {match.match_type !== "exact" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMatch(idx)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8 bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Fuzzy Suggestions ({processData.suggested_matches?.length || 0})</h3>
            {(processData.suggested_matches?.length || 0) > 0 && (
              <Button onClick={handleApproveAllFuzzy} variant="outline" size="sm">
                Approve All Fuzzy
              </Button>
            )}
          </div>

          {(processData.suggested_matches?.length || 0) === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">No fuzzy suggestions available</p>
              <p className="text-sm text-muted-foreground">Exact matches are already approved</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {processData.suggested_matches
                ?.filter((match: any) => !approvedMatches.find((approved: any) => approved.current_row_number === match.current_row_number))
                .map((match: any, idx: number) => (
                  <div key={`suggested-${idx}`} className="px-6 py-4 hover:bg-muted/50 transition-colors bg-accent/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{match.current_project_name || match.project_name || "-"}</p>
                          <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded font-medium">
                            {getSuggestedMatchPercent(match).toFixed(1)}% match
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Row {match.current_row_number} → Row {match.suggested_previous_row_number || match.previous_row_number || "-"} (Suggested match)
                        </p>
                        {(match.suggested_project_name || match.previous_project_name) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Suggested project: {match.suggested_project_name || match.previous_project_name}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                          <div className="bg-muted p-2 rounded">
                            <p className="text-muted-foreground">
                              Current: {formatNumber(match.current_values?.closing_balance || match.current_values?.as_on_31_mar)}
                            </p>
                          </div>
                          <div className="bg-muted p-2 rounded">
                            <p className="text-muted-foreground">Previous: {formatNumber(match.previous_values?.closing_balance)}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setApprovedMatches([...approvedMatches, normalizeApprovedMatch(match)])}
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

        <div className="mb-8 bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Manual Matching ({remainingCurrentRows.length})</h3>
            <p className="text-sm text-muted-foreground">Match the remaining current year rows to an available previous year row.</p>
          </div>

          {remainingCurrentRows.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">All current year rows are matched</p>
              <p className="text-sm text-muted-foreground">You can proceed to results</p>
            </div>
          ) : remainingPreviousRows.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <p className="text-foreground font-medium">No previous year rows left to match</p>
              <p className="text-sm text-muted-foreground">If this is expected, review the data before proceeding.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {remainingCurrentRows.map((row: any) => (
                <div key={row.row_number} className="px-6 py-4">
                  <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
                    <div>
                      <p className="font-medium text-foreground">{row.project_name}</p>
                      <p className="text-xs text-muted-foreground">Current Row {row.row_number}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">Select previous year project</label>
                      <select
                        value={manualSelections[row.row_number] || ""}
                        onChange={(e) =>
                          setManualSelections((prev) => ({
                            ...prev,
                            [row.row_number]: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="">Choose previous year project</option>
                        {remainingPreviousRows.map((previousRow: any) => (
                          <option key={previousRow.row_number} value={previousRow.row_number}>
                            {previousRow.project_name} (Row {previousRow.row_number})
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button onClick={() => handleManualMatch(row)} disabled={!manualSelections[row.row_number]} size="sm">
                      Add Manual Match
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-between">
          <Button onClick={() => navigate("/preview")} variant="outline">
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={!allCurrentRowsMatched || isSubmitting} size="lg">
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
