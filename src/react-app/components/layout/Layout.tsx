import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  fileName?: string;
  isProcessing?: boolean;
  processingProgress?: number;
}

export default function Layout({
  children,
  fileName,
  isProcessing,
  processingProgress,
}: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          fileName={fileName}
          isProcessing={isProcessing}
          processingProgress={processingProgress}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
