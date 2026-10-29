import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ResearchOverviewPage } from "./pages/ResearchOverviewPage";
import { ModelComparisonPage } from "./pages/ModelComparisonPage";
import { EcgAnalysisPage } from "./pages/EcgAnalysisPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { apiService } from "./services/api";
import type { 
  HealthResponse, 
  ModelMetadata, 
  ExperimentResultsResponse, 
  SampleSignalItem 
} from "./types/api";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Global loaded data
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [experiments, setExperiments] = useState<ExperimentResultsResponse | null>(null);
  const [samples, setSamples] = useState<SampleSignalItem[]>([]);

  const [loadingExperiments, setLoadingExperiments] = useState<boolean>(true);
  const [experimentError, setExperimentError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Health check
    apiService.getHealth()
      .then(setHealth)
      .catch((err) => console.warn("Backend health check failed:", err));

    // 2. Models list
    apiService.getModels()
      .then(setModels)
      .catch((err) => console.warn("Failed to load models:", err));

    // 3. Experiments matrix
    setLoadingExperiments(true);
    apiService.getExperiments()
      .then((data) => {
        setExperiments(data);
        setExperimentError(null);
      })
      .catch((err) => {
        setExperimentError(err.message || "Failed to load experiment results.");
      })
      .finally(() => setLoadingExperiments(false));

    // 4. Sample signals
    apiService.getSampleSignals()
      .then(setSamples)
      .catch((err) => console.warn("Failed to load sample signals:", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Main Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} health={health} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === "overview" && (
          <ResearchOverviewPage
            onNavigateToAnalysis={() => setActiveTab("analysis")}
            onNavigateToComparison={() => setActiveTab("comparison")}
          />
        )}

        {activeTab === "comparison" && (
          <ModelComparisonPage
            experimentData={experiments}
            loading={loadingExperiments}
            error={experimentError}
          />
        )}

        {activeTab === "analysis" && (
          <EcgAnalysisPage
            models={models}
            samples={samples}
          />
        )}

        {activeTab === "methodology" && (
          <MethodologyPage />
        )}
      </main>
    </div>
  );
};

export default App;
