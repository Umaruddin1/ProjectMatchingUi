import { useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/react-app/components/layout/Layout";
import { Button } from "@/react-app/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { useWorkflow } from "@/react-app/lib/workflowContext";
import { processFiles } from "@/react-app/lib/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const {
    currentFile,
    previousFile,
    setCurrentFile,
    setPreviousFile,
    setProcessData,
    setProcessError,
    setIsProcessing,
  } = useWorkflow();

  const [isDragging, setIsDragging] = useState<"current" | "previous" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.currentTarget.id as "current" | "previous");
  };

  const handleDragLeave = () => {
    setIsDragging(null);
  };

  const validateFile = (file: File): boolean => {
    const validExtensions = [".xls", ".xlsx", ".xlsm"];
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      setUploadError("Invalid file format. Please upload .xls, .xlsx, or .xlsm files.");
      return false;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File is too large. Maximum size is 100 MB.");
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent, type: "current" | "previous") => {
    e.preventDefault();
    setIsDragging(null);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      if (type === "current") {
        setCurrentFile(file);
      } else {
        setPreviousFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "current" | "previous") => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      if (type === "current") {
        setCurrentFile(file);
      } else {
        setPreviousFile(file);
      }
    }
  };

  const clearFile = (type: "current" | "previous") => {
    if (type === "current") {
      setCurrentFile(null);
    } else {
      setPreviousFile(null);
    }
    setUploadError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleAnalyze = async () => {
    if (!currentFile || !previousFile) {
      setUploadError("Please upload both current and previous year files");
      return;
    }

    setUploadError(null);
    setIsAnalyzing(true);
    setIsProcessing(true);

    try {
      const result = await processFiles(currentFile, previousFile);

      if (result.success) {
        setProcessData(result);
        setProcessError(null);
        navigate("/preview");
      } else {
        setUploadError(result.error || "Failed to process files");
        setProcessError(result.error || "Failed to process files");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setUploadError(errorMsg);
      setProcessError(errorMsg);
    } finally {
      setIsAnalyzing(false);
      setIsProcessing(false);
    }
  };

  const bothFilesUploaded = currentFile && previousFile;

  return (
    <Layout isProcessing={isAnalyzing}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Excel Files</h2>
          <p className="text-muted-foreground">
            Upload two Excel files: one for current year (31 Mar) and one for previous year (31 Dec)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Current Year */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Current Year (31 Mar)</label>
            {!currentFile ? (
              <div
                id="current"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "current")}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center",
                  isDragging === "current" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50",
                  isAnalyzing && "pointer-events-none"
                )}
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Drag and drop</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept=".xls,.xlsx,.xlsm"
                  onChange={(e) => handleFileSelect(e, "current")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="bg-card border border-success/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{currentFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(currentFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => clearFile("current")}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to analyze
                </div>
              </div>
            )}
          </div>

          {/* Previous Year */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Previous Year (31 Dec)</label>
            {!previousFile ? (
              <div
                id="previous"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "previous")}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 text-center",
                  isDragging === "previous" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50",
                  isAnalyzing && "pointer-events-none"
                )}
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Drag and drop</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept=".xls,.xlsx,.xlsm"
                  onChange={(e) => handleFileSelect(e, "previous")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="bg-card border border-success/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{previousFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(previousFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => clearFile("previous")}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to analyze
                </div>
              </div>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{uploadError}</p>
          </div>
        )}

        {bothFilesUploaded && (
          <div className="flex gap-3">
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1" size="lg">
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">⚙️</span> Analyzing...
                </>
              ) : (
                <>
                  Analyze Files
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
