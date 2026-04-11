'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { documentAPI } from '@/services/api';
import ResultCard from '@/components/ResultCard';

interface HistoryItem {
  id: string;
  doc_type: string;
  status: string;
  created_at: string;
}

export default function HistoryPage() {
  const [documents, setDocuments] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await documentAPI.getHistory();
        setDocuments(data);
      } catch (err: any) {
        console.error(err);
        setError('Could not load history. Please ensure the backend is online.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-8 lg:p-12 animate-fade-in">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Processing History</h1>
        <p className="text-textMuted text-lg">View and manage your previously analyzed documents.</p>
      </header>

      <section className="flex-1 w-full max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted">Loading history...</p>
          </div>
        ) : error ? (
          <div className="glass-card p-12 text-center border-red-500/20">
            <span className="text-4xl mb-4 block">🔌</span>
            <p className="text-red-400">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card p-20 text-center">
            <span className="text-5xl mb-6 block">📭</span>
            <h3 className="text-2xl text-white font-bold mb-3">No History Found</h3>
            <p className="text-textMuted mb-8">Start by uploading your first document on the dashboard.</p>
            <Link href="/" className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Link href={`/document/${doc.id}`} key={doc.id}>
                <div className="glass-card group hover:scale-[1.02] cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-2xl group-hover:bg-primary/20 transition-colors">
                      {doc.doc_type === 'invoice' ? '📄' : doc.doc_type === 'receipt' ? '🧾' : '📑'}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      doc.status === 'completed' ? 'bg-accent/10 border-accent/30 text-accent' :
                      doc.status === 'failed' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      'bg-primary/10 border-primary/30 text-primary animate-pulse'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1 capitalize">
                    {doc.doc_type?.replace('_', ' ') || 'Document'}
                  </h3>
                  <p className="text-xs text-textMuted font-mono mb-4">
                    {doc.id.substring(0, 18)}...
                  </p>
                  
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-[10px] text-textMuted">
                        {new Date(doc.created_at).toLocaleDateString()} • {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex space-x-2">
                        <span className="text-primary text-xs font-medium group-hover:translate-x-1 transition-transform">
                          View Report →
                        </span>
                        <button 
                          onClick={() => {
                            window.location.href = `/chat?docId=${doc.id}`;
                          }}
                          className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all"
                        >
                          💬 Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
