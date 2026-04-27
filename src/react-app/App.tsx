import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router";
import { WorkflowProvider } from "@/react-app/lib/workflowContext";
import { isAuthenticated } from "@/react-app/lib/api";
import HomePage from "@/react-app/pages/Home";
import DataPreviewPage from "@/react-app/pages/DataPreviewPage";
import ErrorDetectionPage from "@/react-app/pages/ErrorDetectionPage";
import CorrectionsPage from "@/react-app/pages/CorrectionsPage";
import ResultsPage from "@/react-app/pages/ResultsPage";
import HistoryPage from "@/react-app/pages/HistoryPage";
import LoginPage from "@/react-app/pages/LoginPage";

function ProtectedRoutes() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <WorkflowProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/preview" element={<DataPreviewPage />} />
            <Route path="/errors" element={<ErrorDetectionPage />} />
            <Route path="/corrections" element={<CorrectionsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </Router>
    </WorkflowProvider>
  );
}
