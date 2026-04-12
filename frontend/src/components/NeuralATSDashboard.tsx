'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ATSIntelligence {
  ats_score: number;
  competitiveness: string;
  skill_gap_analysis: {
    found: string[];
    missing: string[];
  };
  impact_keywords: {
    matched: string[];
    missing: string[];
  };
  compatibility_roadmap: Array<{
    phase: string;
    status: string;
    suggestion: string;
  }>;
  overall_summary: string;
}

interface Props {
  data: ATSIntelligence;
  filename: string;
}

export default function NeuralATSDashboard({ data, filename }: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to actual value
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayScore(prev => {
          if (prev < data.ats_score) return prev + 1;
          clearInterval(interval);
          return data.ats_score;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [data.ats_score]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            Neural <span className="text-primary">ATS Intelligence</span>
          </h2>
          <p className="text-textMuted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Analysis complete for: <span className="text-white font-medium">{filename}</span>
          </p>
        </div>
        
        <div className="glass px-6 py-4 rounded-2xl flex items-center gap-6 border-primary/20 bg-primary/5">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={226}
                strokeDashoffset={226 - (226 * displayScore) / 100}
                className="text-primary transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-bold text-white">{displayScore}%</span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-textMuted mb-1">Competitiveness</div>
            <div className={`text-xl font-bold ${
              data.competitiveness === 'Elite' ? 'text-accent' : 
              data.competitiveness === 'High' ? 'text-primary' : 'text-white'
            }`}>
              {data.competitiveness}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Roadmap */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card flex-1">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-primary">99%</span> Compatibility Roadmap
            </h3>
            
            <div className="flex flex-col gap-0">
              {data.compatibility_roadmap.map((step, idx) => (
                <div key={idx} className="relative pl-10 pb-8 last:pb-0">
                  {/* Timeline line */}
                  {idx !== data.compatibility_roadmap.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-white/10"></div>
                  )}
                  
                  {/* Timeline node */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                    step.status === 'completed' ? 'bg-primary border-primary' :
                    step.status === 'critical' ? 'bg-accent/20 border-accent animate-pulse' : 'bg-background border-white/20'
                  }`}>
                    {step.status === 'completed' ? (
                      <span className="text-black text-xs font-bold">✓</span>
                    ) : (
                      <span className="text-white/40 text-[10px]">{idx + 1}</span>
                    )}
                  </div>
                  
                  <div className={`transition-all duration-300 ${activeStep === idx ? 'scale-[1.02]' : ''}`} 
                       onClick={() => setActiveStep(idx)}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className={`font-bold ${step.status === 'critical' ? 'text-accent' : 'text-white'}`}>
                        {step.phase}
                      </h4>
                      <span className={`text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded ${
                        step.status === 'completed' ? 'bg-primary/20 text-primary' : 
                        step.status === 'critical' ? 'bg-accent/20 text-accent' : 'bg-white/5 text-textMuted'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                    <p className="text-sm text-textMuted leading-relaxed">
                      {step.suggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card bg-accent/5 border-accent/10">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span>🎯</span> Neural Strategy Summary
            </h3>
            <p className="text-sm text-white/80 leading-relaxed italic">
              "{data.overall_summary}"
            </p>
          </div>
        </div>

        {/* Right Column: Key-cloud & Skill Analysis */}
        <div className="flex flex-col gap-8">
          
          {/* Skill Gap Analysis */}
          <div className="glass-card">
            <h3 className="text-lg font-bold mb-4">Skill Intelligence</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs text-textMuted mb-2 uppercase tracking-wide">Identified Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {data.skill_gap_analysis.found.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-2 text-white/10 uppercase tracking-[0.3em] text-[8px] flex items-center gap-2">
                <div className="h-px flex-1 bg-white/10"></div>
                Gap Detected
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              <div>
                <div className="text-xs text-accent mb-2 uppercase tracking-wide">Missing Key Skills</div>
                <div className="flex flex-wrap gap-2">
                  {data.skill_gap_analysis.missing.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Impact Keywords */}
          <div className="glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl text-primary font-serif">"</span>
            </div>
            <h3 className="text-lg font-bold mb-4">Impact Optimization</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-textMuted mb-2">Matched Power Words</div>
                <div className="flex flex-wrap gap-1">
                  {data.impact_keywords.matched.map((kw, i) => (
                    <span key={i} className="text-[9px] font-medium text-white/60">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-primary mb-2">Recommended Injectors</div>
                <div className="flex flex-wrap gap-2">
                  {data.impact_keywords.missing.map((kw, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 cursor-default transition-colors">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button */}
      <div className="flex justify-center mt-4">
        <button className="glass px-8 py-3 rounded-full text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2 group border-white/10">
          Re-Scan Document
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
}
