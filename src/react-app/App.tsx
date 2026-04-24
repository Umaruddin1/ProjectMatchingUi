import { BrowserRouter as Router, Routes, Route } from "react-router";
import { WorkflowProvider } from "@/react-app/lib/workflowContext";
import HomePage from "@/react-app/pages/Home";
import DataPreviewPage from "@/react-app/pages/DataPreviewPage";
import ErrorDetectionPage from "@/react-app/pages/ErrorDetectionPage";
import CorrectionsPage from "@/react-app/pages/CorrectionsPage";
import ResultsPage from "@/react-app/pages/ResultsPage";
import HistoryPage from "@/react-app/pages/HistoryPage";

export default function App() {
  return (
    <WorkflowProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/preview" element={<DataPreviewPage />} />
          <Route path="/errors" element={<ErrorDetectionPage />} />
          <Route path="/corrections" element={<CorrectionsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Router>
    </WorkflowProvider>
  );
}
