const API_BASE_URL =
  import.meta.env.VITE_API_URL_SERVER || "https://project-matching-service.vercel.app";
const AUTH_TOKEN_KEY = "syncwave_auth_token";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ProcessResponse {
  success: boolean;
  current_year_rows: Row[];
  previous_year_rows: Row[];
  exact_matches: Match[];
  suggested_matches: Match[];
  ambiguous_matches?: any[];
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
  current_row_number?: number;
  previous_row_number?: number;
  project_name: string;
  current_values: Record<string, any>;
  previous_values: Record<string, any>;
  wip_impact?: number;
  far_impact?: number;
  fuzzy_match_score?: number;
  match_status?: string;
  requires_review?: boolean;
  match_type?: string;
  current_project?: string;
  previous_project?: string;
}

export interface ValidationIssue {
  row_number: number;
  sheet?: string;
  file_type?: "current_year" | "previous_year";
  file_name?: string;
  source_label?: string;
  project_name: string;
  issue?: string;
  description?: string;
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
  include_unmatched_rows?: boolean;
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
  total_unmatched_current?: number;
  total_unmatched_previous?: number;
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

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    throw new Error("Authentication required. Please log in.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseApiError(response, `Login failed: ${response.statusText}`);
    throw new Error(message);
  }

  const data: LoginResponse = await response.json();
  localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
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
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await parseApiError(response, `Upload failed: ${response.statusText}`);
    throw new Error(message);
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
      ...getAuthHeaders(),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await parseApiError(response, `Reconciliation failed: ${response.statusText}`);
    throw new Error(message);
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
      ...getAuthHeaders(),
    },
    body: JSON.stringify(reconciliationData),
  });

  if (!response.ok) {
    const message = await parseApiError(response, `Export failed: ${response.statusText}`);
    throw new Error(message);
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
