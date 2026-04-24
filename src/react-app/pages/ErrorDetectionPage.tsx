import Layout from "@/react-app/components/layout/Layout";
import { Construction } from "lucide-react";

export default function ErrorDetectionPage() {
  return (
    <Layout fileName="projects_2024.xlsx">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Error Detection
        </h2>
        <p className="text-muted-foreground max-w-md">
          This screen will show detected inconsistencies between WIP and FAR
          values, with summary cards and filterable error tables.
        </p>
      </div>
    </Layout>
  );
}
