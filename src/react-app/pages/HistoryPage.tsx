import Layout from "@/react-app/components/layout/Layout";
import { Construction } from "lucide-react";

export default function HistoryPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Processing History
        </h2>
        <p className="text-muted-foreground max-w-md">
          This screen will show previously processed files with the ability to
          download corrected results again.
        </p>
      </div>
    </Layout>
  );
}
