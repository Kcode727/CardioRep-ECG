import React from "react";
import { Activity, BarChart2, BookOpen, Cpu } from "lucide-react";
import type { HealthResponse } from "../types/api";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, health }) => {
  const navItems = [
    { id: "overview", label: "Research Overview", icon: Activity },
    { id: "comparison", label: "Model Comparison", icon: BarChart2 },
    { id: "analysis", label: "ECG Analysis", icon: Cpu, highlight: true },
    { id: "methodology", label: "Methodology", icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Project Title without Logo Box */}
          <div 
            className="cursor-pointer"
            onClick={() => setActiveTab("overview")}
          >
            <span className="text-lg font-bold text-slate-900 tracking-tight">CardioRep ECG</span>
            <p className="text-xs text-slate-500 hidden sm:block">PTB-XL Representation Learning</p>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? item.highlight
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                        : "bg-slate-100 text-slate-900"
                      : item.highlight
                      ? "text-indigo-600 hover:bg-indigo-50 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Hardware Status */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {health ? (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                <span className={`w-2 h-2 rounded-full ${health.status === "healthy" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                <span className="font-medium capitalize">{health.status}</span>
                <span className="text-slate-300">|</span>
                <span className="uppercase text-slate-500 font-mono text-[11px]">{health.device}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
