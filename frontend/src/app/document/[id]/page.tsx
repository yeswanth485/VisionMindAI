'use client';

import { useEffect, useState } from 'react';
import { documentAPI } from '@/services/api';
import { DocumentResponse } from '@/types';
import ResultCard from '@/components/ResultCard';

export default function DocumentResultPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchDocument = async () => {
      try {
        const data = await documentAPI.getDocument(params.id);
        setDoc(data);

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch document status.");
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    fetchDocument();

    // Poll every 2 seconds
    intervalId = setInterval(fetchDocument, 2000);

    return () => clearInterval(intervalId);
  }, [params.id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="glass-card p-8 border-red-500/30 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error Occurred</h2>
          <p className="text-textMuted">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isProcessing = !doc || doc.status === 'processing' || doc.status === 'pending';
  const isFailed = doc?.status === 'failed';

  return (
    <div className="p-6 md:p-10 h-full flex flex-col animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            Intelligence Report
            {doc?.doc_type && doc.doc_type !== 'other' && (
              <span className="px-3 py-1 text-sm font-medium bg-secondary/20 text-secondary border border-secondary/30 rounded-full uppercase tracking-wider">
                {doc.doc_type.replace('_', ' ')}
              </span>
            )}
          </h1>
          <p className="text-textMuted text-sm mt-1">ID: {params.id}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-3 px-4 py-2 glass rounded-full border-primary/30 text-primary">
              <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="font-medium">AI is Analyzing...</span>
            </div>
          )}
          {doc?.status === 'completed' && (
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border-accent/30 text-accent">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span className="font-medium">Analysis Complete</span>
            </div>
          )}
          {isFailed && (
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border-red-500/30 text-red-400">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">Analysis Failed</span>
            </div>
          )}
        </div>
      </header>

      {isProcessing && (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-4 border-4 border-secondary rounded-full border-b-transparent animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">🧠</div>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Processing Document Vectors</h3>
            <p className="text-textMuted max-w-md text-center">
              Our AI pipelines are extracting text via OCR, structuring the data, and generating risk assessments. Please wait a moment.
            </p>
        </div>
      )}

      {isFailed && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="glass-card p-8 border-red-500/30 max-w-xl w-full">
            <h3 className="text-xl font-bold text-red-400 mb-4 border-b border-white/10 pb-4">Processing Failed</h3>
            <pre className="text-xs text-textMuted overflow-auto bg-black/20 p-4 rounded-lg whitespace-pre-wrap font-mono">
              {JSON.stringify(doc?.structured_json || "Unknown error occurred during processing chain.", null, 2)}
            </pre>
          </div>
        </div>
      )}

      {doc?.status === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)] pb-10">
          
          {/* LEFT SIDE: Source Document */}
          <div className="h-full flex flex-col gap-6">
            <ResultCard title="Source Document" icon="📄" delay={100}>
              <div className="h-full bg-black/40 rounded-xl overflow-hidden border border-white/5 relative group">
                {doc.file_url ? (
                  // Uses the Render backend URL mapped to the upload file path
                  <img 
                    src={process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}${doc.file_url}` : `https://visionmind-backend-eg9f.onrender.com${doc.file_url}`}
                    alt="Source Document"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-textMuted">Preview not available</div>
                )}
                
                {/* Overlay for raw text view toggle could be added here */}
              </div>
            </ResultCard>

            {/* Decision & Risk */}
            <div className="h-48 shrink-0">
               <ResultCard title="AI Decision & Risk" icon="⚖️" delay={400}>
                  <div className="flex flex-col md:flex-row h-full gap-4">
                    <div className="flex-1 bg-white/5 rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
                      <div className={`absolute inset-0 opacity-10 ${
                        doc.decision?.risk_level === 'high' ? 'bg-red-500' :
                        doc.decision?.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-accent'
                      }`}></div>
                      <span className="text-textMuted text-xs uppercase tracking-widest mb-1">Risk Level</span>
                      <span className={`text-3xl font-bold capitalize ${
                        doc.decision?.risk_level === 'high' ? 'text-red-400' :
                        doc.decision?.risk_level === 'medium' ? 'text-yellow-400' : 'text-accent'
                      }`}>{doc.decision?.risk_level || 'Unknown'}</span>
                      <span className="text-white/50 text-sm mt-2">{doc.decision?.confidence_score}% Confidence</span>
                    </div>

                    <div className="flex-[2] bg-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                      <span className="text-textMuted text-xs uppercase tracking-widest mb-2 block">Decision Status</span>
                      <span className="text-white font-medium capitalize mb-3 block text-lg bg-primary/20 inline-block px-3 py-1 rounded-md border border-primary/30">
                        {doc.decision?.decision_status?.replace('_', ' ')}
                      </span>
                      {doc.decision?.recommended_actions && (
                        <ul className="text-sm text-textMuted list-disc pl-4 space-y-1">
                          {doc.decision.recommended_actions.map((act: string, i: number) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
               </ResultCard>
            </div>
          </div>

          {/* RIGHT SIDE: Extracted Data */}
          <div className="h-full flex flex-col gap-6">
            <ResultCard title="Structured Data" icon="🗂️" delay={200}>
              <div className="bg-[#0D1117] rounded-xl p-5 border border-white/5 h-full overflow-y-auto custom-scrollbar font-mono text-sm shadow-inner text-[#E6EDF3]">
                {doc.structured_json ? (
                  <RenderJson data={doc.structured_json} />
                ) : (
                  <span className="text-gray-500">No structured data extracted.</span>
                )}
              </div>
            </ResultCard>

            <ResultCard title="Validation & Insights" icon="🔍" delay={300}>
              <div className="space-y-4">
                {/* Validation Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  doc.validation?.is_valid ? 'bg-accent/10 border-accent/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{doc.validation?.is_valid ? '✅' : '❌'}</span>
                    <div>
                      <h4 className="text-white font-medium">Validation Status</h4>
                      <p className="text-xs text-textMuted">Score: {doc.validation?.validation_score || 0}/100</p>
                    </div>
                  </div>
                </div>

                {/* Insights Summary */}
                {doc.insights && (
                  <div className="bg-white/5 p-4 rounded-xl">
                     <h4 className="text-white font-medium mb-2 text-sm uppercase tracking-wider">Summary</h4>
                     <p className="text-textMuted text-sm leading-relaxed">{doc.insights.summary}</p>
                  </div>
                )}
              </div>
            </ResultCard>
          </div>

        </div>
      )}
    </div>
  );
}

// Helper component for rendering JSON recursively with syntax highlighting feeling
function RenderJson({ data }: { data: any }) {
  if (typeof data !== 'object' || data === null) {
    return <span className="text-[#A5D6FF]">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="pl-4 border-l border-white/10 ml-2">
        <span className="text-gray-500">[</span>
        {data.map((item, i) => (
          <div key={i} className="my-1">
            <RenderJson data={item} />
            {i < data.length - 1 && <span className="text-gray-500">,</span>}
          </div>
        ))}
        <span className="text-gray-500">]</span>
      </div>
    );
  }

  return (
    <div className="pl-4 border-l border-white/10 ml-2 space-y-1">
      <span className="text-gray-500">{'{'}</span>
      {Object.entries(data).map(([key, value], i, arr) => (
        <div key={key} className="pl-4">
          <span className="text-[#7EE787]">"{key}"</span>
          <span className="text-gray-400 mr-2">:</span>
          <RenderJson data={value} />
          {i < arr.length - 1 && <span className="text-gray-500">,</span>}
        </div>
      ))}
      <span className="text-gray-500">{'}'}</span>
    </div>
  );
}
