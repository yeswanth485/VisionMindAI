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
        const errorMsg = err.response?.data?.detail || err.message || "Unknown Connection Error";
        setError(`Failed to fetch document status: ${errorMsg}`);
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
  
  // Robust Resume Detection (handles sentences or keywords from AI)
  const docTypeLower = doc?.doc_type?.toLowerCase() || '';
  const isResume = docTypeLower.includes('resume') || 
                   docTypeLower.includes('curriculum') || 
                   docTypeLower.includes('cv') ||
                   docTypeLower.includes('bio-data');

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
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase transition-all">
              {isResume ? (
                <span className="flex items-center gap-4">
                  <span className="text-accent">NEURAL ATS</span>
                  <span className="text-primary italic">SCANNER</span>
                </span>
              ) : (
                <span className="flex items-center gap-4">
                  <span>INTELLIGENCE</span>
                  <span className="text-primary italic">REPORT</span>
                </span>
              )}
            </h1>
            {doc?.doc_type && (
              <span className={`px-4 py-1.5 text-xs font-bold border rounded-full uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] ${
                isResume ? 'bg-accent/20 text-accent border-accent/30' : 'bg-primary/20 text-primary border-primary/30'
              }`}>
                {doc.doc_type.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-textMuted text-xs font-bold uppercase tracking-widest">
             <span className="bg-white/5 px-2 py-0.5 rounded font-mono">ID: {params.id.substring(0,8)}</span>
             {doc?.created_at && (
                <span>• GENERATED {new Date(doc.created_at).toLocaleDateString()}</span>
             )}
          </div>
        </div>
        
         <div className="flex items-center gap-3">
            <button 
                onClick={() => {
                  window.location.href = `/chat?docId=${params.id}`;
                }}
                className={`px-8 py-3 text-white rounded-2xl font-bold shadow-lg transition-all uppercase tracking-widest text-xs ${
                  isResume ? 'bg-accent hover:shadow-accent/40' : 'bg-primary hover:shadow-primary/40'
                }`}
              >
                💬 {isResume ? 'RESUME AI COACH' : 'NEURAL CHAT'}
            </button>
         </div>
      </header>

      {isProcessing ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative w-40 h-40 mb-10">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-12 border-4 border-accent rounded-full border-l-transparent animate-spin font-bold text-4xl flex items-center justify-center">🧠</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">SYNAPTIC SCANNING</h3>
            <p className="text-textMuted max-w-lg text-center leading-relaxed font-medium">
              Awaiting neural extraction completion. Usually takes 5-8 seconds.
            </p>
        </div>
      ) : isFailed ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="glass-card p-12 border-red-500/30 max-w-2xl w-full shadow-2xl rounded-[2rem]">
            <h3 className="text-2xl font-bold text-red-400 mb-6">SCAN FAILED</h3>
            <div className="bg-black/40 p-6 rounded-2xl mb-8">
               <pre className="text-xs text-red-300 overflow-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(doc?.structured_json?.error || "Neural interface disconnected.", null, 2)}
               </pre>
            </div>
            <Link href="/" className="block text-center py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all font-bold uppercase tracking-widest text-xs">
                Retry Upload
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20">
          
          {/* COLUMN 1: Visuals & Decision (4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            <ResultCard title="SOURCE PREVIEW" icon="📄">
              <div className="h-[400px] bg-black/40 rounded-3xl overflow-hidden border border-white/5 relative group">
                {doc?.file_url ? (
                  doc.file_url.toLowerCase().endsWith('.pdf') ? (
                    <embed src={`https://visionmind-backend.onrender.com${doc.file_url}`} type="application/pdf" className="w-full h-full" />
                  ) : (
                    <img src={`https://visionmind-backend.onrender.com${doc.file_url}`} alt="Source" className="w-full h-full object-contain p-4" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-textMuted gap-4">
                     <span className="text-4xl opacity-20">🖼️</span>
                     <p className="font-bold uppercase tracking-widest text-[10px]">Preview Unavailable</p>
                  </div>
                )}
              </div>
            </ResultCard>

            <ResultCard title="NEURAL DECISION" icon="⚖️">
               <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 ${
                        doc?.decision?.risk_level === 'high' ? 'bg-red-500' : 'bg-accent'
                      }`}></div>
                      <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold mb-4">Integrity Level</p>
                      <h4 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${
                        doc?.decision?.risk_level === 'high' ? 'text-red-400' : 'text-accent'
                      }`}>{doc?.decision?.risk_level || 'UNKNOWN'}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-accent" style={{ width: `${doc?.decision?.confidence_score || 0}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-white">{doc?.decision?.confidence_score}%</span>
                      </div>
                  </div>

                  {isResume && (
                    <div className="p-6 bg-accent/10 border border-accent/20 rounded-3xl relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>
                        <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-4">ATS COMPATIBILITY SCORE</p>
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-5xl font-black text-white tracking-tighter">{doc?.insights?.ats_score || 0}%</h4>
                           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">🚀</div>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-6">
                           <div 
                              className="h-full bg-accent shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
                              style={{ width: `${doc?.insights?.ats_score || 0}%` }}
                           ></div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                           <p className="text-[10px] text-white/50 leading-relaxed italic">
                              "Current structure optimized for global ATS standards. Aiming for 99% logic below."
                           </p>
                        </div>
                    </div>
                   )}

                  <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl">
                      <h3 className="text-xl font-bold text-white mb-4">
                         {doc?.decision?.decision_status === 'approved' ? '✓ APPROVED' : '⚠ REVIEW REQUIRED'}
                      </h3>
                      <div className="space-y-3">
                         {doc?.decision?.recommended_actions?.map((act: string, i: number) => (
                           <div key={i} className="flex gap-3 items-start text-xs text-textMuted">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                              <span>{act}</span>
                           </div>
                         ))}
                      </div>
                  </div>
               </div>
            </ResultCard>
          </div>

          {/* COLUMN 2: Extraction (8 cols) */}
          <div className="xl:col-span-8 flex flex-col gap-8">
            <ResultCard title="INTELLIGENT EXTRACTION" icon="📊">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categorized Displays */}
                  <div className="glass-card p-6 bg-white/5 border-white/10 rounded-3xl">
                     <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                       {isResume ? 'Professional Identity' : 'Identity & Counterparties'}
                     </h4>
                     <div className="space-y-4">
                        {isResume ? (
                           <>
                              <FactItem label="Full Name" value={doc?.structured_json?.full_name} isBold />
                              <FactItem label="Email" value={doc?.structured_json?.email} />
                              <FactItem label="Phone" value={doc?.structured_json?.phone} />
                              <FactItem label="Current Role" value={doc?.structured_json?.job_title} />
                           </>
                        ) : (
                           <>
                              <FactItem label="Vendor" value={doc?.structured_json?.vendor_name || doc?.structured_json?.merchant_name} />
                              <FactItem label="Customer" value={doc?.structured_json?.customer_name} />
                              <FactItem label="Counterparties" value={doc?.structured_json?.parties} />
                              <FactItem label="Signatories" value={doc?.structured_json?.signatories} />
                           </>
                        )}
                     </div>
                  </div>

                  <div className="glass-card p-6 bg-white/5 border-white/10 rounded-3xl">
                     <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                        {isResume ? 'Career Overview' : 'Financial Core'}
                     </h4>
                     <div className="space-y-4">
                        {isResume ? (
                           <>
                              <FactItem label="Total Exp" value={`${doc?.structured_json?.experience_years} Years`} isBold />
                              <FactItem label="Region" value={doc?.structured_json?.location} />
                              <FactItem label="Primary Target" value={doc?.structured_json?.job_title} />
                              <FactItem label="Education" value={doc?.structured_json?.education?.[0] || 'Available in chat'} />
                           </>
                        ) : (
                           <>
                              <FactItem label="Grand Total" value={doc?.structured_json?.total_amount || doc?.structured_json?.contract_value} isBold />
                              <FactItem label="Subtotal" value={doc?.structured_json?.subtotal} />
                              <FactItem label="Tax / VAT" value={doc?.structured_json?.tax} />
                              <FactItem label="Currency" value={doc?.structured_json?.currency || 'USD'} />
                           </>
                        )}
                     </div>
                  </div>

                  <div className="glass-card p-6 bg-white/5 border-white/10 rounded-3xl">
                     <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Timeline & Reference</h4>
                     <div className="space-y-4">
                        <FactItem label="Document Date" value={doc?.structured_json?.date || doc?.structured_json?.effective_date} />
                        <FactItem label="Reference #" value={doc?.structured_json?.invoice_number || doc?.structured_json?.id_number} />
                        <FactItem label="Expiry Date" value={doc?.structured_json?.expiration_date} />
                        <FactItem label="Payment Term" value={doc?.structured_json?.payment_method} />
                     </div>
                  </div>

                  <div className="glass-card p-6 bg-white/5 border-white/10 rounded-3xl">
                     <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-6 border-b border-white/5 pb-4">AI Narrative</h4>
                     <p className="text-sm text-textMuted leading-relaxed italic">
                        "{doc?.insights?.summary}"
                     </p>
                  </div>
               </div>
            </ResultCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ResultCard title="VALIDATION MATRIX" icon="🛡️">
                    <div className="flex flex-col items-center py-6">
                        <div className="w-24 h-24 rounded-full border-4 border-accent/20 flex items-center justify-center relative">
                            <span className="text-2xl font-black text-white">{doc?.validation?.validation_score || 0}%</span>
                            <div className="absolute inset-[-4px] rounded-full border-4 border-accent border-t-transparent animate-spin-slow"></div>
                        </div>
                        <div className="mt-8 w-full space-y-2">
                           {doc?.validation?.issues_found?.length > 0 ? (
                              doc.validation.issues_found.map((issue: string, i: number) => (
                                 <div key={i} className="px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] text-red-300">⚠ {issue}</div>
                              ))
                           ) : (
                              <div className="px-4 py-3 bg-accent/5 border border-accent/10 rounded-xl text-[10px] text-accent font-bold text-center">✓ INTEGRITY CHECKS PASSED</div>
                           )}
                        </div>
                    </div>
                </ResultCard>
                
                <ResultCard title={isResume ? "ATS UPGRADE ROADMAP (TO 99%)" : "ACTIONABLE SUGGESTIONS"} icon="💡">
                    <div className="space-y-3">
                       {(doc?.insights?.ats_roadmap || doc?.insights?.recommendations)?.map((rec: string, i: number) => (
                          <div key={i} className={`p-3 rounded-xl border flex gap-3 items-center ${
                             isResume 
                               ? 'bg-accent/5 border-accent/20 text-accent/80' 
                               : 'bg-white/5 border-white/5 text-textMuted'
                            }`}>
                             <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0"></span>
                             <span className="text-[10px] leading-relaxed font-bold">{rec}</span>
                          </div>
                       ))}
                       {isResume && (
                          <div className="mt-4 p-4 bg-primary/20 border border-primary/30 rounded-2xl">
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Neural Recommendation for 99%</p>
                             <p className="text-sm text-white leading-relaxed">
                                {doc?.insights?.missing_impact_keywords?.length > 0 
                                  ? `Include missing impact keywords: ${doc.insights.missing_impact_keywords.join(', ')}. This will bridge the logic gap for top-tier enterprise screeners.`
                                  : "Optimizing your keywords density... Use the AI Coach to refine specific sections."}
                             </p>
                          </div>
                       )}
                       {!isResume && doc?.insights?.improvements?.length > 0 && (
                          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                             <p className="text-[10px] font-bold text-primary uppercase mb-2">Neural Improvement</p>
                             <p className="text-[10px] text-white italic">"{doc.insights.improvements[0]}"</p>
                          </div>
                       )}
                    </div>
                </ResultCard>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function FactItem({ label, value, isBold }: { label: string, value: any, isBold?: boolean }) {
   if (value === undefined || value === null) return null;
   const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 30) + '...' : String(value);
   
   return (
      <div className="flex justify-between items-center group">
         <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest">{label}</span>
         <span className={`text-sm truncate max-w-[150px] ${isBold ? 'text-white font-black' : 'text-white/80'}`}>
            {displayValue}
         </span>
      </div>
   )
}
