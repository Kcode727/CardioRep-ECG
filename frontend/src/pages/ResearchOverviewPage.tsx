import React from "react";
import { 
  Activity, 
  ArrowRight, 
  Layers, 
  Database, 
  GitBranch
} from "lucide-react";

interface ResearchOverviewPageProps {
  onNavigateToAnalysis: () => void;
  onNavigateToComparison: () => void;
}

export const ResearchOverviewPage: React.FC<ResearchOverviewPageProps> = ({
  onNavigateToAnalysis,
  onNavigateToComparison
}) => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Academic Investigation & Full-Stack Prototype</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            ECG-Based Cardiac Abnormality Classification Using Deep Learning
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Investigating whether unsupervised representation learning—specifically Autoencoder and 
            Variational Autoencoder pretraining—improves multi-label 12-lead ECG abnormality 
            classification when labeled clinical training data is severely restricted.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToAnalysis}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm shadow-indigo-100"
            >
              <span>Launch ECG Analysis Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToComparison}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition"
            >
              <span>Explore Research Results</span>
            </button>
          </div>
        </div>
      </section>

      {/* The Core Problem & Motivation */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">The Research Problem</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Standard 12-lead electrocardiography is the fundamental clinical tool for diagnosing acute ischemia, 
            arrhythmias, and structural heart defects. However, deep neural networks require thousands of verified 
            training signals. While unlabeled raw ECG telemetry is abundant in hospital databases, obtaining 
            expert consensus annotations by certified cardiologists is prohibitively expensive and time-consuming.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Why Limited Labeled Data Matters</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In rare cardiac conditions, pediatric cohorts, or resource-constrained healthcare environments, only a 
            small fraction of signals have validated annotations. This study systematically explores 
            training with <strong>10% (350 records)</strong>, <strong>25% (875 records)</strong>, 
            <strong>50% (1,750 records)</strong>, and <strong>100% (3,500 records)</strong> of labeled data to assess 
            whether unsupervised pretraining provides sample efficiency.
          </p>
        </div>
      </section>

      {/* Three Evaluated Architectural Approaches */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Three Model Approaches Investigated</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            All models share an identical 1D CNN backbone (3 conv layers, kernel size 7, stride 2, AdaptiveAvgPool 8, latent dim 128) 
            to isolate the effect of the representation learning strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Model 1: Baseline CNN */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                Baseline Supervised
              </span>
              <h3 className="text-base font-bold text-slate-900">1D CNN Classifier</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trained completely from scratch with random weight initialization using only labeled ECG signals. 
                Learns discriminatory spatial-temporal representations directly from multi-label binary cross-entropy loss.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono">
              Optimization: AdamW + early stopping
            </div>
          </div>

          {/* Model 2: AE-CNN */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 px-2 py-0.5 rounded bg-purple-50 border border-purple-100">
                Deterministic Pretraining
              </span>
              <h3 className="text-base font-bold text-slate-900">Autoencoder-Pretrained CNN</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The convolutional encoder is pretrained on unlabeled 12-lead signals to reconstruct waveforms 
                via a convolutional decoder minimizing Mean Squared Error (MSE). The encoder weights are then frozen or 
                fine-tuned for multi-label classification.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono">
              Objective: Reconstruction MSE loss
            </div>
          </div>

          {/* Model 3: VAE-CNN */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                Probabilistic Pretraining
              </span>
              <h3 className="text-base font-bold text-slate-900">VAE-Pretrained CNN</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pretrained using a Variational Autoencoder formulation. The encoder maps ECG waveforms into a continuous 
                Gaussian latent distribution parameterized by mean (&mu;) and log-variance (log &sigma;&sup2;), 
                optimizing the Evidence Lower Bound (reconstruction + KL-divergence regularization).
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono">
              Objective: ELBO (MSE + &beta;-KL divergence)
            </div>
          </div>
        </div>
      </section>

      {/* The Five Diagnostic Superclasses */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Five Diagnostic Superclasses (PTB-XL)</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            In standard clinical cardiology, diagnoses frequently overlap. Consequently, this problem is formulated as 
            <strong> multi-label prediction</strong> using 5 independent sigmoid probability outputs rather than a mutually exclusive softmax.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              code: "NORM",
              title: "Normal ECG",
              desc: "Absence of pathological wave deflections, rhythm anomalies, or conduction blocks.",
              badge: "bg-emerald-50 text-emerald-700 border-emerald-200"
            },
            {
              code: "MI",
              title: "Myocardial Infarction",
              desc: "Ischemic myocardial tissue death, marked by ST elevations, depressions, or pathological Q-waves.",
              badge: "bg-rose-50 text-rose-700 border-rose-200"
            },
            {
              code: "STTC",
              title: "ST/T Change",
              desc: "Non-specific or ischemic repolarization changes in the ST-segment or T-wave morphology.",
              badge: "bg-amber-50 text-amber-700 border-amber-200"
            },
            {
              code: "CD",
              title: "Conduction Disturbance",
              desc: "Impaired electrical transmission, including bundle branch blocks and AV conduction delays.",
              badge: "bg-indigo-50 text-indigo-700 border-indigo-200"
            },
            {
              code: "HYP",
              title: "Hypertrophy",
              desc: "Enlargement and muscle thickening of the cardiac chambers (e.g. Left Ventricular Hypertrophy).",
              badge: "bg-violet-50 text-violet-700 border-violet-200"
            }
          ].map((item) => (
            <div key={item.code} className="p-4 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-2">
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${item.badge}`}>
                {item.code}
              </span>
              <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
              <p className="text-xs text-slate-600 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dataset & Partitioning */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-slate-900 font-bold">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg">Experimental Dataset & Partitioning</h2>
          </div>
          <a
            href="https://physionet.org/content/ptb-xl/1.0.3/"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            Access PTB-XL Dataset on PhysioNet &rarr;
          </a>
        </div>

        <div className="prose prose-sm text-slate-600 space-y-3">
          <p>
            The models were developed using the open-access <strong>PTB-XL database</strong>. 
            The experimental dataset downloaded for this research comprises <strong>5,037 records</strong> structured across official patient-stratified folds:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase">Training Set</span>
              <p className="text-base font-bold text-slate-900">3,500 Records</p>
              <p className="text-xs text-slate-500">Patient-separated folds 1–8</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase">Validation Set</span>
              <p className="text-base font-bold text-slate-900">500 Records</p>
              <p className="text-xs text-slate-500">Official fold 9 (threshold selection)</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase">Test Set</span>
              <p className="text-base font-bold text-slate-900">500 Records</p>
              <p className="text-xs text-slate-500">Official fold 10 (held-out reporting)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
