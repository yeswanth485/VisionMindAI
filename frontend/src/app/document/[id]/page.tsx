'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch document status.");
        clearInterval(intervalId);
      }
    };

    fetchDocument();
    intervalId = setInterval(fetchDocument, 2000);
    return () => clearInterval(intervalId);
  }, [params.id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="glass-card p-12 text-center border-red-500/20 max-w-md w-full">
          <span className="text-5xl mb-6 block">⚠️</span>
          <h2 className="text-2xl font-bold text-white mb-2">Error Occurred</h2>
          <p className="text-textMuted mb-8">{error}</p>
          <Link href="/" className="inline-block px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = !doc || doc.status === 'processing' || doc.status === 'pending';
  const isFailed = doc?.status === 'failed';

  return (
    <div className="p-6 md:p-10 min-h-full flex flex-col animate-fade-in relative">
      
      {/* Top Navigation / Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-4 text-sm font-medium">
        <Link href="/" className="text-textMuted hover:text-primary transition-colors">Dashboard</Link>
        <span className="text-white/20">/</span>
        <Link href="/history" className="text-textMuted hover:text-primary transition-colors">History</Link>
        <span className="text-white/20">/</span>
        <span className="text-primary truncate max-w-[150px]">Report {params.id.substring(0,6)}</span>
      </nav>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Intelligence Report</h1>
            {doc?.doc_type && doc.doc_type !== 'other' && (
              <span className="px-4 py-1.5 text-xs font-bold bg-primary/20 text-primary border border-primary/30 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                {doc.doc_type.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-textMuted text-sm">
             <span className="bg-white/5 px-2 py-0.5 rounded font-mono">ID: {params.id}</span>
             {doc?.created_at && (
                <span>• Generated {new Date(doc.created_at).toLocaleString()}</span>
             )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-3 px-5 py-2.5 glass rounded-2xl border-primary/30 text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="font-bold tracking-wide">ANALYZING DOCUMENT...</span>
            </div>
          )}
          {doc?.status === 'completed' && (
            <div className="flex items-center gap-2 px-5 py-2.5 glass rounded-2xl border-accent/40 text-accent shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
              <span className="font-bold tracking-wide">ANALYSIS COMPLETE</span>
            </div>
          )}
          <Link href="/" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-medium transition-all">
             + New Upload
          </Link>
        </div>
      </header>

      {isProcessing && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative w-40 h-40 mb-10">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-6 border-4 border-secondary rounded-full border-b-transparent animate-spin-slow" style={{ animationDirection: 'reverse' }}></div>
              <div className="absolute inset-12 border-4 border-accent rounded-full border-l-transparent animate-spin font-bold text-4xl flex items-center justify-center">🧠</div>
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full -z-10 animate-pulse-slow"></div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Extracting Knowledge</h3>
            <p className="text-textMuted max-w-lg text-center leading-relaxed">
              Our neural engines are currently scanning vectors, structuring entities, and evaluating risk weights. This normally takes 5-10 seconds.
            </p>
        </div>
      )}

      {isFailed && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="glass-card p-10 border-red-500/30 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
                <span className="text-4xl">❌</span>
                <div>
                   <h3 className="text-2xl font-bold text-red-400">Processing Chain Failed</h3>
                   <p className="text-textMuted text-sm">An error occurred while communicating with the AI models.</p>
                </div>
            </div>
            <div className="bg-black/40 p-6 rounded-2xl">
               <h4 className="text-xs uppercase tracking-widest text-textMuted mb-3 font-bold">Error Logs</h4>
               <pre className="text-sm text-red-300 overflow-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {JSON.stringify(doc?.structured_json?.error || "Unknown system failure occurred during document inhalation.", null, 2)}
               </pre>
            </div>
            <Link href="/" className="mt-8 block text-center py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all font-bold uppercase tracking-widest text-xs">
                Retry Upload
            </Link>
          </div>
        </div>
      )}

      {doc?.status === 'completed' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20">
          
          {/* COLUMN 1: Visuals & Decision (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-8">
            
            <ResultCard title="Document Preview" icon="📄" delay={100}>
              <div className="h-[500px] bg-black/40 rounded-2xl overflow-hidden border border-white/5 relative group transition-all hover:border-white/20">
                {doc.file_url ? (
                  doc.file_url.toLowerCase().endsWith('.pdf') ? (
                    <embed 
                      src={`https://visionmind-backend.onrender.com${doc.file_url}`}
                      type="application/pdf"
                      className="w-full h-full"
                    />
                  ) : (
                    <img 
                      src={`https://visionmind-backend.onrender.com${doc.file_url}`}
                      alt="Source Document"
                      className="w-full h-full object-contain p-4"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-textMuted gap-4">
                     <span className="text-4xl opacity-20">🖼️</span>
                     <p>Electronic Preview Unavailable</p>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-primary transition-colors">
                      🔍 Enlarge
                   </button>
                </div>
              </div>
            </ResultCard>

            <ResultCard title="Automated Decisioning" icon="⚖️" delay={300}>
               <div className="space-y-6">
                  {/* Risk Meter */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-30 ${
                        doc.decision?.risk_level === 'high' ? 'bg-red-500' :
                        doc.decision?.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-accent'
                      }`}></div>
                      <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold mb-1">Risk Assessment</p>
                      <h4 className={`text-2xl font-black capitalize tracking-tight ${
                        doc.decision?.risk_level === 'high' ? 'text-red-400' :
                        doc.decision?.risk_level === 'medium' ? 'text-yellow-400' : 'text-accent'
                      }`}>{doc.decision?.risk_level || 'Indeterminate'}</h4>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold mb-1">Model Confidence</p>
                      <div className="flex items-end gap-1">
                         <h4 className="text-2xl font-black text-white">{doc.decision?.confidence_score}%</h4>
                         <span className="text-[10px] text-accent mb-1.5 font-bold">Accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* Decision Conclusion */}
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Recommended Status</span>
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono text-white">READY</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                         {doc.decision?.decision_status === 'approved' ? '✅ Approved' : 
                          doc.decision?.decision_status === 'requires_review' ? '🟡 Manual Review' : 
                          doc.decision?.decision_status === 'rejected' ? '❌ Rejected' : '⚪ Pending Review'}
                      </h3>
                      <div className="space-y-3">
                         {doc.decision?.recommended_actions?.map((act: string, i: number) => (
                           <div key={i} className="flex gap-3 items-start text-sm text-textMuted group">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></span>
                              <span>{act}</span>
                           </div>
                         ))}
                      </div>
                  </div>
               </div>
            </ResultCard>

          </div>

          {/* COLUMN 2: Extraction & Logs (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-8 h-full">
            
            <ResultCard title="Extracted Entities & Data" icon="📊" delay={200}>
              <div className="bg-[#0D1117] rounded-2xl border border-white/5 h-full overflow-hidden flex flex-col shadow-2xl">
                 <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Structured Output View</span>
                    <div className="flex gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-400/50"></div>
                    </div>
                 </div>
                 <div className="p-6 overflow-y-auto custom-scrollbar flex-1 font-mono text-sm leading-relaxed">
                    {doc.structured_json ? (
                       <div className="space-y-1">
                          {Object.entries(doc.structured_json).map(([key, value]) => (
                             <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-2 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] px-2 rounded-lg transition-colors group">
                                <span className="md:col-span-4 text-primary/80 font-bold group-hover:text-primary capitalize">{key.replace(/_/g, ' ')}</span>
                                <div className="md:col-span-8 text-white/90">
                                   <FormattedValue value={value} />
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="text-center py-20 text-textMuted italic">Analysis incomplete.</div>
                    )}
                 </div>
              </div>
            </ResultCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                <ResultCard title="Validation Metrics" icon="🛡️" delay={400}>
                   <div className="space-y-4">
                      <div className="flex items-center justify-center py-6 relative">
                         <div className="w-32 h-32 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                            <span className="text-3xl font-black text-white">{doc.validation?.validation_score || 0}%</span>
                            <div className="absolute inset-[-10px] rounded-full border-[10px] border-accent border-t-transparent animate-pulse-slow"></div>
                         </div>
                      </div>
                      
                      <div className="space-y-3">
                         <h5 className="text-[10px] font-bold text-textMuted uppercase tracking-widest border-b border-white/5 pb-2">Identified Issues</h5>
                         {doc.validation?.issues_found?.length > 0 ? (
                            doc.validation.issues_found.map((issue: string, i: number) => (
                               <div key={i} className="flex gap-3 text-xs text-red-300 items-start p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                  <span>🚩</span>
                                  <span>{issue}</span>
                               </div>
                            ))
                         ) : (
                            <div className="text-xs text-accent font-medium flex gap-2 items-center p-3 bg-accent/5 rounded-xl">
                               <span>✨</span> Integrity checks passed. No anomalies found.
                            </div>
                         )}
                      </div>
                   </div>
                </ResultCard>

                <ResultCard title="AI Narrative Insights" icon="🕯️" delay={500}>
                   <div className="space-y-6">
                      <div className="relative">
                         <span className="text-4xl absolute -top-4 -left-2 opacity-10">"</span>
                         <p className="text-sm text-textMuted italic leading-relaxed pt-2 pl-4">
                            {doc.insights?.summary || "Executive summary unavailable."}
                         </p>
                      </div>

                      <div className="space-y-3">
                         <h5 className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Key Insights</h5>
                         <div className="flex flex-wrap gap-2">
                            {doc.insights?.key_entities?.map((ent: string, i: number) => (
                               <span key={i} className="px-3 py-1 bg-white/5 text-[10px] text-white border border-white/10 rounded-full font-medium">
                                  {ent}
                               </span>
                            ))}
                         </div>
                      </div>
                      
                      <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-2xl">
                         <h5 className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Strategic Suggestion</h5>
                         <p className="text-xs text-white leading-relaxed">
                            {doc.insights?.recommendations?.[0] || 'Observe document manually for standard oversight.'}
                         </p>
                      </div>
                   </div>
                </ResultCard>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}

function FormattedValue({ value }: { value: any }) {
  if (value === null || value === undefined) return <span className="opacity-30">null</span>;
  if (typeof value === 'boolean') return <span className={value ? "text-accent" : "text-red-400"}>{value ? 'TRUE' : 'FALSE'}</span>;
  if (typeof value === 'object') {
     if (Array.isArray(value)) {
        return (
           <div className="space-y-2">
              {value.map((item, i) => (
                 <div key={i} className="bg-white/5 p-2 rounded-xl text-xs border border-white/5">
                    <FormattedValue value={item} />
                 </div>
              ))}
           </div>
        )
     }
     return (
        <div className="space-y-1">
           {Object.entries(value).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                 <span className="text-textMuted font-bold">{k}:</span>
                 <FormattedValue value={v} />
              </div>
           ))}
        </div>
     )
  }
  return <span>{String(value)}</span>;
}
