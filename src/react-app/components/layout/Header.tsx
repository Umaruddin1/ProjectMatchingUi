import { Bell, User, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

interface HeaderProps {
  fileName?: string;
  isProcessing?: boolean;
  processingProgress?: number;
}

export default function Header({
  fileName,
  isProcessing,
  processingProgress,
}: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">
          Excel Data Correction Tool
        </h1>

        {fileName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
            <FileSpreadsheet className="w-4 h-4 text-success" />
            <span className="text-sm text-foreground font-medium">
              {fileName}
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-primary/10 rounded-md">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-primary font-medium">
              Processing...
            </span>
            {processingProgress !== undefined && (
              <div className="w-24 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
