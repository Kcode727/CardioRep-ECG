import type {
  HealthResponse,
  ModelMetadata,
  ExperimentResultsResponse,
  PredictionResultResponse,
  SampleSignalItem,
  SignalPreview
} from "../types/api";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        errorMessage = data.detail;
      }
    } catch {
      // Keep default message
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getModels(): Promise<ModelMetadata[]> {
    const res = await fetch(`${API_BASE}/models`);
    return handleResponse<ModelMetadata[]>(res);
  },

  async getExperiments(): Promise<ExperimentResultsResponse> {
    const res = await fetch(`${API_BASE}/experiments`);
    return handleResponse<ExperimentResultsResponse>(res);
  },

  async getSampleSignals(): Promise<SampleSignalItem[]> {
    const res = await fetch(`${API_BASE}/samples`);
    return handleResponse<SampleSignalItem[]>(res);
  },

  async getSamplePreview(sampleId: string): Promise<SignalPreview> {
    const res = await fetch(`${API_BASE}/samples/${sampleId}/preview`);
    return handleResponse<SignalPreview>(res);
  },

  async predictFile(file: File, modelId: string): Promise<PredictionResultResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_id", modelId);

    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: formData
    });
    return handleResponse<PredictionResultResponse>(res);
  },

  async predictSample(sampleId: string, modelId: string): Promise<PredictionResultResponse> {
    const formData = new FormData();
    formData.append("model_id", modelId);

    const res = await fetch(`${API_BASE}/predict-sample/${sampleId}`, {
      method: "POST",
      body: formData
    });
    return handleResponse<PredictionResultResponse>(res);
  }
};
