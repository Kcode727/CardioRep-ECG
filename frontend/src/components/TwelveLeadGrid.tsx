import React, { useState } from "react";
import { LeadWaveformPlot } from "./LeadWaveformPlot";
import type { SignalPreview } from "../types/api";
import { Grid, X, ZoomIn } from "lucide-react";

interface TwelveLeadGridProps {
  signalInfo: SignalPreview;
}

export const TwelveLeadGrid: React.FC<TwelveLeadGridProps> = ({ signalInfo }) => {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const leads = signalInfo.leads;
  const waveforms = signalInfo.waveform_preview;

  const activeSummary = selectedLead 
    ? signalInfo.lead_summaries.find(s => s.lead === selectedLead)
    : null;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-2">
          <Grid className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">12-Lead Electrocardiogram View</span>
          <span className="text-xs text-slate-500">
            ({signalInfo.num_leads} leads, {signalInfo.duration_seconds}s @ {signalInfo.sampling_rate_hz} Hz)
          </span>
        </div>
      </div>

      {/* Enlarged Single Lead Modal / Banner if selected */}
      {selectedLead && waveforms[selectedLead] && (
        <div className="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ZoomIn className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900">Enlarged Inspection: Lead {selectedLead}</span>
              {activeSummary && (
                <span className="text-xs text-slate-500 font-mono">
                  Mean: {activeSummary.mean.toFixed(3)} mV | Std: {activeSummary.std.toFixed(3)} mV | Min: {activeSummary.min.toFixed(3)} mV | Max: {activeSummary.max.toFixed(3)} mV
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
              title="Close focus view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <LeadWaveformPlot
            leadName={`Lead ${selectedLead}`}
            data={waveforms[selectedLead]}
            minVal={activeSummary?.min}
            maxVal={activeSummary?.max}
            height={200}
            gridStyle="subtle"
            showDetails={true}
          />
        </div>
      )}

      {/* 12-Lead Standard Grid: 4 columns x 3 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {leads.map((leadName) => {
          const leadData = waveforms[leadName] || [];
          const summary = signalInfo.lead_summaries.find(s => s.lead === leadName);
          return (
            <div key={leadName} className="cursor-pointer" onClick={() => setSelectedLead(leadName)}>
              <LeadWaveformPlot
                leadName={leadName}
                data={leadData}
                minVal={summary?.min}
                maxVal={summary?.max}
                height={95}
                gridStyle="subtle"
                showDetails={true}
                onExpand={() => setSelectedLead(leadName)}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 text-center">
        Tip: Click on any lead card to open a full-resolution enlarged waveform viewer.
      </p>
    </div>
  );
};
