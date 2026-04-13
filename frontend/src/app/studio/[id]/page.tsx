'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { documentAPI, multimodalAPI } from '@/services/api';
import UploadForm from '@/components/UploadForm';
import ResultCard from '@/components/ResultCard';

function StudioReportContent() {
  const params = useParams();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (id) {
      setDocumentId(id);
      loadDocumentResults(id);
    }
  }, [params.id]);


  const loadDocumentResults = async (id: string) => {
    setLoading(true);
    try {
      const result = await documentAPI.getDocument(id);
      setResults([result]);
    } catch (error) {
      console.error('Error loading document:', error);
      setResults([{
        error: error instanceof Error ? error.message : 'Document not found',
        input_type: 'error',
        summary: 'Loading failed'
      }]);
    } finally {
      setLoading(false);
    }
  };


  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const result = await multimodalAPI.process(file);
      setResults(prev => [result, ...prev]);
    } catch (error) {
      console.error('Upload error:', error);
      setResults(prev => [
        {
          error: error instanceof Error ? error.message : 'An unknown error occurred',
          input_type: 'error',
          summary: 'Processing failed'
        },
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900/30 to-black">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/30 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                Document Analysis #{documentId?.slice(-8) || 'Loading...'}
              </h1>
              {documentId && (
                <p className="text-textMuted/70 text-sm mt-1 font-mono bg-black/20 px-3 py-1 rounded-full">
                  {documentId}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="glass-card px-6 py-3 flex items-center gap-2 hover:bg-white/10 transition-all group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Studio</span>
          </button>
        </div>
        
        <div className="space-y-8">
          <UploadForm onUpload={handleUpload} loading={loading} />
          
          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Processing Results
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {results.map((result, index) => (
                  <ResultCard key={index} result={result} delay={index * 150} />
                ))}
              </div>
            </div>
          )}
          
          {results.length === 0 && !loading && (
            <div className="glass-card p-20 text-center border-2 border-dashed border-white/10">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-3xl flex items-center justify-center">
                <span className="text-3xl opacity-50">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Analysis Available</h3>
              <p className="text-textMuted max-w-lg mx-auto mb-8">
                Processing results for this document will appear here. Try uploading a new file above.
              </p>
            </div>
          )}
          
          {loading && (
            <div className="glass-card p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-6"></div>
              <p className="text-white font-medium">Loading document analysis...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

}

export default function StudioReport() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
       </div>
    }>
       <StudioReportContent />
    </Suspense>
  );
}