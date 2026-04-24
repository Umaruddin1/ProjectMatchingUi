const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ProcessResponse {
  success: boolean;
  current_year_rows: Row[];
  previous_year_rows: Row[];
  exact_matches: Match[];
  suggested_matches: Match[];
  unmatched_current_rows: Row[];
  unmatched_previous_rows: Row[];
  validation_issues: ValidationIssue[];
  impact_preview: any[];
  summary: {
    total_current_rows: number;
    total_previous_rows: number;
    exact_matches: number;
    suggested_fuzzy_matches: number;
    ambiguous_fuzzy_matches: number;
    unmatched_current: number;
    unmatched_previous: number;
    validation_issues: number;
  };
  error?: string;
  details?: string;
}

export interface Row {
  row_number: number;
  project_name: string;
  values: Record<string, any>;
}

export interface Match {
  current_row_number: number;
  previous_row_number: number;
  project_name: string;
  current_values: Record<string, any>;
  previous_values: Record<string, any>;
  wip_impact?: number;
  far_impact?: number;
  fuzzy_match_score?: number;
}

export interface ValidationIssue {
  row_number: number;
  sheet: string;
  project_name: string;
  issue: string;
  values?: Record<string, any>;
}

export interface ApprovedMatch {
  current_row_number: number;
  previous_row_number?: number;
  project_name: string;
  current_values: Record<string, any>;
  previous_values?: Record<string, any>;
  wip_impact?: number;
  far_impact?: number;
}

export interface ReconcileRequest {
  approved_matches: ApprovedMatch[];
  current_year_rows: Row[];
  previous_year_rows: Row[];
}

export interface ReconcileResponse {
  success: boolean;
  reconciled_matches: Match[];
  unmatched_current_rows: Row[];
  unmatched_previous_rows: Row[];
  total_current_rows: number;
  total_previous_rows: number;
  total_matched: number;
  total_unmatched: number;
  total_wip_impact: number;
  total_far_impact: number;
  error?: string;
  details?: string;
}

export interface ExportRequest {
  reconciled_matches: Match[];
  unmatched_current_rows: Row[];
  unmatched_previous_rows: Row[];
  validation_issues: ValidationIssue[];
  summary: Record<string, any>;
}

// Process: Upload and parse two files
export async function processFiles(
  currentFile: File,
  previousFile: File
): Promise<ProcessResponse> {
  const formData = new FormData();
  formData.append("current_year_file", currentFile);
  formData.append("previous_year_file", previousFile);

  const response = await fetch(`${API_BASE_URL}/api/v1/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
  }

  return response.json();
}

// Reconcile: Submit approved matches and recalculate
export async function reconcileMatches(
  request: ReconcileRequest
): Promise<ReconcileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reconcile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Reconciliation failed: ${response.statusText}`);
  }

  return response.json();
}

// Export: Generate Excel file
export async function exportToExcel(
  reconciliationData: ExportRequest
): Promise<Blob | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reconciliationData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Export failed: ${response.statusText}`);
  }

  return response.blob();
}

// Helper: Download blob as file
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
