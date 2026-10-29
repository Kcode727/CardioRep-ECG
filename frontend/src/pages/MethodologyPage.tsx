import React from "react";
import { 
  BookOpen, 
  Layers, 
  Database, 
  Sliders, 
  CheckCircle2
} from "lucide-react";

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Technical Documentation & Model Methodology</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Methodology, Model Architecture & Experimental Setup
        </h1>
        <p className="text-sm text-slate-600">
          Full technical disclosure of dataset preparation, network architectures, unsupervised pretraining objectives, 
          decision threshold calibration, and empirical analysis.
        </p>
      </div>

      {/* 1. Dataset & Patient-Separated Partitioning */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-slate-900 font-bold">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg">1. Dataset Source & Patient-Separated Partitions</h2>
          </div>
          <a
            href="https://physionet.org/content/ptb-xl/1.0.3/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            Access PTB-XL Dataset on PhysioNet &rarr;
          </a>
        </div>

        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            The project utilizes the <strong>PTB-XL database</strong> (v1.0.3), a publicly accessible clinical dataset of 12-lead electrocardiograms 
            annotated according to SCP-ECG statements. The experimental dataset downloaded for this research comprises 
            <strong>5,037 records</strong> structured according to the official patient-separated folds:
          </p>
          <p>
            To prevent patient data leakage across splits, the official patient-stratified folds were preserved:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Training Set</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Folds 1 to 8</p>
              <p className="text-xs text-slate-500">3,500 patient-separated records</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Validation Set</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Fold 9</p>
              <p className="text-xs text-slate-500">500 records (early stopping & thresholds)</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Held-Out Test Set</span>
              <p className="text-sm font-bold text-slate-900 mt-1">Fold 10</p>
              <p className="text-xs text-slate-500">500 records (unbiased final reporting)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Signal Preprocessing & Normalization */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg">2. Signal Dimensions & Frozen Preprocessing</h2>
        </div>

        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            Signals are sampled at <strong>100 Hz</strong> for 10 seconds, yielding an input matrix of shape:
          </p>
          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
            Tensor Layout: [batch_size, leads=12, time_steps=1000] (float32)
          </div>
          <p>
            To prevent data leakage from the validation or test sets into the preprocessing pipeline, 
            <strong> per-lead z-score normalization parameters</strong> (mean and standard deviation per lead) 
            were computed exclusively from the 3,500 training recordings:
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs">
            x_normalized = (x - lead_mean) / max(lead_std, 1e-6)
          </div>
          <p>
            These exact 12 lead means and 12 standard deviations were serialized into every model checkpoint and are 
            applied identically during runtime inference.
          </p>
        </div>
      </section>

      {/* 3. Mathematical Architectures & Pretraining Objectives */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg">3. Model Architectures & Optimization</h2>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            All three models utilize the identical 1D convolutional encoder backbone to guarantee a controlled architectural comparison:
          </p>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2 text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wide">Backbone (ECGEncoder):</span>
            <ul className="list-disc pl-5 space-y-1 font-mono text-slate-700">
              <li>Conv1d(12 &rarr; 32, kernel=7, stride=2, pad=3) + BatchNorm1d + ReLU</li>
              <li>Conv1d(32 &rarr; 64, kernel=7, stride=2, pad=3) + BatchNorm1d + ReLU</li>
              <li>Conv1d(64 &rarr; 128, kernel=7, stride=2, pad=3) + BatchNorm1d + ReLU</li>
              <li>AdaptiveAvgPool1d(8) &rarr; Flatten (1024 dims)</li>
              <li>Linear(1024 &rarr; 128) [Latent Embedding Dimension = 128]</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-blue-600">1. Baseline CNN</h4>
              <p className="text-xs text-slate-600">
                Random initialization of encoder and head. Trained end-to-end directly using labeled training signals with Multi-label Binary Cross-Entropy loss.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-purple-600">2. AE-CNN</h4>
              <p className="text-xs text-slate-600">
                Encoder coupled with a 1D convolutional decoder. Pretrained on unsupervised training signals minimizing Mean Squared Error (MSE) reconstruction loss:
                <br /><code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded mt-1 inline-block">L_recon = ||x - x_hat||^2</code>
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase text-emerald-600">3. VAE-CNN</h4>
              <p className="text-xs text-slate-600">
                Encoder projects to mean and log-variance vectors. Pretrained on unsupervised training signals optimizing the Evidence Lower Bound:
                <br /><code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded mt-1 inline-block">L = MSE + beta * D_KL</code>
              </p>
            </div>
          </div>

          <div className="pt-2 space-y-1 text-xs text-slate-600">
            <p><strong>Supervised Fine-Tuning:</strong> AdamW optimizer, learning rate = 1e-3, weight decay = 1e-4, batch size = 64, maximum 50 epochs.</p>
            <p><strong>Early Stopping:</strong> Monitored validation loss on fold 9 with patience = 5 epochs and minimum delta = 1e-4.</p>
            <p><strong>Threshold Calibration:</strong> Decision thresholds tuned independently per diagnostic label using grid search (17 candidate thresholds from 0.1 to 0.9) maximizing validation F1.</p>
          </div>
        </div>
      </section>

      {/* 4. Empirical Scope & Observations */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg">4. Empirical Scope & Research Observations</h2>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Label Efficiency Profile:</strong> VAE pretraining demonstrated highest utility at the extreme data-scarce fraction (10% labels: 0.529 macro-F1 vs. 0.510 baseline).
            </li>
            <li>
              <strong>Supervised Baseline Recovery:</strong> With 25% labels (875 records), supervised learning directly from scratch achieved the highest macro-F1 (0.590 vs. 0.544).
            </li>
            <li>
              <strong>High-Data Convergence:</strong> At 50% and 100% labeled data, Autoencoder pretraining provided consistent performance (0.626 and 0.666 macro-F1).
            </li>
            <li>
              <strong>Diagnostic Specificity:</strong> High representation of common classes (NORM) supports strong detection (0.85 F1), while complex conditions (CD, HYP) benefit from regularized representations.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
