/**
 * Global state context for the reconciliation workflow
 */

import React, { createContext, useContext, useState } from "react";

interface ProcessData {
  success: boolean;
  current_year_rows: any[];
  previous_year_rows: any[];
  exact_matches: any[];
  suggested_matches: any[];
  unmatched_current_rows: any[];
  unmatched_previous_rows: any[];
  validation_issues: any[];
  impact_preview: any[];
  summary: any;
  error?: string;
  details?: string;
}

interface ReconcileData {
  success: boolean;
  reconciled_matches: any[];
  unmatched_current_rows: any[];
  unmatched_previous_rows: any[];
  total_current_rows: number;
  total_previous_rows: number;
  total_matched: number;
  total_unmatched: number;
  total_wip_impact: number;
  total_far_impact: number;
  error?: string;
  details?: string;
}

interface WorkflowContextType {
  // File info
  currentFile: File | null;
  previousFile: File | null;
  setCurrentFile: (file: File | null) => void;
  setPreviousFile: (file: File | null) => void;

  // Process data
  processData: ProcessData | null;
  setProcessData: (data: ProcessData | null) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
  processError: string | null;
  setProcessError: (error: string | null) => void;

  // Reconcile data
  reconcileData: ReconcileData | null;
  setReconcileData: (data: ReconcileData | null) => void;
  isReconciling: boolean;
  setIsReconciling: (value: boolean) => void;
  reconcileError: string | null;
  setReconcileError: (error: string | null) => void;

  // Approved matches
  approvedMatches: any[];
  setApprovedMatches: (matches: any[]) => void;
  addApprovedMatch: (match: any) => void;
  removeApprovedMatch: (index: number) => void;

  // Reset workflow
  resetWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previousFile, setPreviousFile] = useState<File | null>(null);

  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const [reconcileData, setReconcileData] = useState<ReconcileData | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const [approvedMatches, setApprovedMatches] = useState<any[]>([]);

  const addApprovedMatch = (match: any) => {
    setApprovedMatches([...approvedMatches, match]);
  };

  const removeApprovedMatch = (index: number) => {
    setApprovedMatches(approvedMatches.filter((_, i) => i !== index));
  };

  const resetWorkflow = () => {
    setCurrentFile(null);
    setPreviousFile(null);
    setProcessData(null);
    setProcessError(null);
    setReconcileData(null);
    setReconcileError(null);
    setApprovedMatches([]);
  };

  const value: WorkflowContextType = {
    currentFile,
    setCurrentFile,
    previousFile,
    setPreviousFile,

    processData,
    setProcessData,
    isProcessing,
    setIsProcessing,
    processError,
    setProcessError,

    reconcileData,
    setReconcileData,
    isReconciling,
    setIsReconciling,
    reconcileError,
    setReconcileError,

    approvedMatches,
    setApprovedMatches,
    addApprovedMatch,
    removeApprovedMatch,

    resetWorkflow,
  };

  return (
    <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return context;
};
